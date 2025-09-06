module.exports = function isAdmin(userId) {
    const adminIDs = [
        process.env.ADMIN_ID_1,
        process.env.ADMIN_ID_2
    ].filter(Boolean);
    return adminIDs.includes(userId);
};