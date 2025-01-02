const Job = require('./job/executor');

var isCheckerTime = true;
setInterval(async () => {
  if (isCheckerTime) {
    isCheckerTime = false;
    console.log('=========🔥🔥start presale job🔥🔥============');
    const currentTime = new Date();
    console.log(`Current Date and Time: ${currentTime.toLocaleString()}`);
    await Job.main();
    isCheckerTime = false;
    console.log('=========🤘🤘ended presale job🤘🤘============');
  }
}, 1);
