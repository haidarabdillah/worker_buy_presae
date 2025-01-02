worker ekseskusi trade presale
1. database yang dipakai 
  a. database user
  b. database settings
  c. databse trade
2. alur yang dipakai
  a. worker kan mengecek transaksi pending yang ada di table trade
  b. worker melakukan validasi dengan decode tx hash via proxy dan melakukan check harga dari table setting
  c. melakukan  finishing dengan merubah status sesuai kondisi transaksi
  d. melakukan update total buy dari user
