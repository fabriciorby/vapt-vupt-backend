const schedule = require('node-schedule');

const scheduleSyncDB = () => {
    schedule.scheduleJob({ hour: 0, minute: 0, dayOfWeek: 6 }, async () => {
        console.log('Scheduler starting...');
        let isSynced = false;
        do {
            console.log(new Date().toLocaleString);
            console.log('Trying to sync...');
            isSynced = await doSyncSmallCapsIntoDB();
        } while (!isSynced)
    });
}

const myScheduler = {
    start: () => {
        scheduleSyncDB();
        console.log('Scheduler initialized.')
    },
    syncNow: () => {
        doSyncSmallCapsIntoDB();
        console.log('Sync triggered.')
    }
}

module.exports = myScheduler;