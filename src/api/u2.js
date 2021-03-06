const adbkit = require('adbkit')
const { join } = require('path')
const ApkReader = require('adbkit-apkreader')
const { installApp, pushFile, runScript } = require('./adb')
const { emitter } = require('./event')

const U2apkPath = join(__dirname, '..', '..', 'static', 'uiautomator2', 'apks')

/**
 * read the device's Uiautomator2's packageInfo
 * @param {String} deviceId deviceId
 * @return {Promise<any>}
 */
const getCurrentU2PackageInfo = async function (deviceId = '') {
  return await runScript(deviceId, 'dumpsys package io.appium.uiautomator2.server')
    .then(adbkit.util.readAll)
}

/**
 * read Uiautomator2(provided by us)'s packageInfo's versionName
 * @param {*} path uiautomator2-server.apk path
 * @return {Promise<String>}
 */
const getDesiredU2VersionName = async function (path) {
  return await ApkReader
    .open(path)
    .then((reader) => reader.readManifest())
    .then(({ versionName }) => versionName)
}

/**
 * install Uiautomator2 to device
 * @param {String} deviceId deviceId
 * @return {Promise<Undefined>}
 */
const installU2ToDevice = async function (deviceId) {
  const [currentPackageInfo, desiredVersion] = await Promise.all([
    getCurrentU2PackageInfo(deviceId),
    getDesiredU2VersionName(join(U2apkPath, 'uiautomator2-server.apk')),
  ]).catch((e) => {
    console.log('????')
    console.log(e)
    console.log('????')
  })
  // If the information is inconsistent we need to override
  if (!currentPackageInfo.includes(`versionName=${desiredVersion}`)) {
    try {
      // install or upgrade directly
      await Promise.all([
        installApp(deviceId, join(U2apkPath, 'uiautomator2-server.apk')),
        installApp(deviceId, join(U2apkPath, 'uiautomator2-test.apk')),
      ])
    } catch (e) {
      console.error(e)
      if (e.message.includes('could not be installed')) {
        emitter.emit('needAdbUsbPermission', deviceId)
      }
      // push apk to device, and install them manually
      // TODO: catch error
      await Promise.all([
        pushFile(
          deviceId,
          join(U2apkPath, 'uiautomator2-server.apk'),
          '/sdcard/uiautomator2-server.apk',
        ),
        pushFile(
          deviceId,
          join(U2apkPath, 'uiautomator2-test.apk'),
          '/sdcard/uiautomator2-test.apk',
        ),
      ]).catch((err) => {
        console.log('222')
        console.error(err)
        console.log('222')
      })
      throw e
    }
  }
  return undefined
}

/**
 * Start Uiautomator2
 * @param {String} deviceId deviceId
 * @return {Promise<any>}
 */
const startU2 = async function (deviceId = '') {
  await runScript(
    deviceId,
    'am instrument -w --no-window-animation io.appium.uiautomator2.server.test/androidx.test.runner.AndroidJUnitRunner',
  )
  await runScript(
    deviceId,
    'am start io.appium.uiautomator2.server/io.appium.uiautomator2.MainActivity',
  )
}

module.exports = {
  startU2,
  installU2ToDevice,
}
