const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  allowedIPs: { type: [String], default: ['127.0.0.1', '::1', '::ffff:127.0.0.1'] },
  instituteName: { type: String, default: 'Institute' }
}, { timestamps: true });

settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
