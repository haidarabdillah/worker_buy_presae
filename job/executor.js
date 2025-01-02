const knex = require('../lib/knex');
const { DecodeTx } = require('../lib/ethers');
const { createLogger, format, transports } = require('winston');

// Fungsi untuk melakukan iterasi asinkron pada array
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

// Konfigurasi logger menggunakan winston untuk mencatat log ke konsol dan file
const logger = createLogger({
  level: 'info', // Level log default
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Menambahkan timestamp
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] - ${message}`) // Format log
  ),
  transports: [
    new transports.Console(), // Log ke konsol
    new transports.File({ filename: './presale-job.log' }), // Log ke file
  ],
});

// Fungsi untuk memperbarui data pada tabel tertentu
async function updateTable(_table, _id, _newValues) {
  try {
    // Melakukan update pada tabel berdasarkan ID
    await knex(_table).where({ id: _id }).update(_newValues);
    logger.info(`succcess updating table ${_table} with ID ${_id}: `);
  } catch (err) {
    // Mencatat error jika terjadi masalah saat update
    logger.error(`Error updating table ${_table} with ID ${_id}: ` + err.message);
  }
}

// Fungsi utama untuk memproses transaksi
async function main() {
  logger.info(`Current Date and Time: ${new Date().toLocaleString()}`); // Mencatat waktu eksekusi

  try {
    // Mengambil semua transaksi dengan status 'pending'
    const transactions = await knex('transactions')
      .where({ status: 'pending' })
      .catch((err) => {
        logger.error('Error fetching transactions: ' + err.message);
        return []; // Jika terjadi error, kembalikan array kosong
      });

    logger.info(`Number of pending transactions: ${transactions.length}`);

    // Jika ada transaksi yang pending, proses lebih lanjut
    if (transactions.length > 0) {
      // Mengambil pengaturan dari tabel 'settings'
      const Settings = await knex('settings')
        .limit(1)
        .then((res) => res[0])
        .catch((err) => {
          logger.error('Error fetching settings: ' + err.message);
          return null;
        });

      // Jika pengaturan tidak berhasil diambil, hentikan proses
      if (!Settings) {
        logger.error('Settings could not be loaded. Exiting...');
        return;
      }

      // Iterasi melalui setiap transaksi
      await asyncForEach(transactions, async (_tx) => {
        logger.info(`⏳ Processing transaction hash: ${_tx.hash}`);

        try {
          // Decode detail transaksi berdasarkan hash
          const detailsTx = await DecodeTx(_tx.hash, Settings.payment_contract);

          // Jika decoding gagal, perbarui status transaksi menjadi 'failed'
          if (!detailsTx) {
            await updateTable('transactions', _tx.id, { status: 'failed', reason: 'not valid tx hash' });
            logger.error(`❌ Failed to decode transaction: ${_tx.hash}`);
            return;
          }

          logger.info('⌛ Decoded transaction details: ' + JSON.stringify(detailsTx, null, 2));

          // Validasi contract address
          if (detailsTx.contractTx !== Settings.payment_contract) {
            await updateTable('transactions', _tx.id, { status: 'failed', reason: 'not valid contract address' });
            logger.error('❌ Invalid contract address detected.');
            return;
          }

          // Validasi destination address
          if (detailsTx.destinationTx !== Settings.address) {
            logger.info(Settings);
            await updateTable('transactions', _tx.id, { status: 'failed', reason: 'not valid destination address' });
            logger.error('❌ Invalid destination address detected.');
            return;
          }

          // Mengambil data pengguna berdasarkan user_id dari transaksi
          const Users = await knex('users')
            .where({ id: _tx.user_id })
            .limit(1)
            .then((res) => res[0])
            .catch((err) => {
              logger.error('Error fetching users: ' + err.message);
              return null;
            });

          // Validasi sender address
          if (detailsTx.SenderTx !== Users.address) {
            logger.info(Settings);
            await updateTable('transactions', _tx.id, { status: 'failed', reason: 'not valid sender address' });
            logger.error('❌ Invalid sender address detected.');
            return;
          }

          // Hitung pembelian baru dan total pembelian
          const currentTotalBuy = parseInt(Users.total_buy);
          const newBuy = Settings.price * detailsTx.fixAMount;
          const newTotalBuy = currentTotalBuy + parseInt(newBuy);

          logger.info(`Details transaction:`);
          logger.info(JSON.stringify({ currentTotalBuy, newBuy, newTotalBuy }, null, 2));

          // Perbarui total pembelian pengguna dan status transaksi
          await updateTable('users', _tx.user_id, { total_buy: newTotalBuy });
          await updateTable('transactions', _tx.id, { status: 'success', amount: newBuy, paid: detailsTx.fixAMount, reason: '' });

          logger.info(`✅ Transaction ${_tx.hash} passed all validations.`);
        } catch (err) {
          logger.error(`Error processing transaction ${_tx.hash}: ${err.message}`);
        }
      });
    }
  } catch (err) {
    logger.error('Unexpected error in main process: ' + err.message);
  }
}

module.exports = { main };
