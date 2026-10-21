const packager = require('electron-packager');
async function bundle() {
  try {
    const appPaths = await packager({
      dir: '.',
      name: 'FishingJoy',
      platform: 'win32',
      arch: 'x64',
      out: 'dist',
      overwrite: true,
      asar: true,
      prune: true,
      ignore: [
        /^\/dist($|\/)/,
        /package_app\.js/,
        /debug_pack\.js/
      ]
    });
    console.log('Packaging complete! Output paths:', appPaths);
  } catch (err) {
    console.error('Packaging failed:', err);
  }
}
bundle();
