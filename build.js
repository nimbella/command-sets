const webpack = require('webpack');
const mkdirp = require('mkdirp');
const readdirp = require('readdirp');
const fs = require('fs');
const path = require('path');

const commands = [
  'dynamodb_list.js',
  'ec2_list.js',
  'ec2_reboot.js',
  'ec2_status.js',
  'rds_list.js',
  'awsbill.js',
  'datadogbill.js',
  'dobill.js',
  'dig.js',
  'droplet_list.js',
  'droplet_reboot.js',
  'droplet_snap.js',
  'droplet_status.js',
  'echo.js',
  'gcloudbill.js',
  'package_list.js',
  'addhost.js',
  'listhosts.js'
];

async function main() {
  const readops = {
    fileFilter: ['commands.yaml', ...commands],
    directoryFilter: ['!.git', '!node_modules', '!dist']
  };

  const outputDir = 'dist';

  for await (const entry of readdirp('.', readops)) {
    const {path: relativePath, fullPath: inputPath, basename} = entry;

    const outputPath = path.join(
      __dirname,
      outputDir,
      relativePath.replace(basename, '')
    );

    mkdirp.sync(outputPath);

    if (basename === 'commands.yaml') {
      fs.copyFile(inputPath, outputPath + basename, error => {
        if (error) {
          console.error('build:', error.message);
        } else {
          console.log(`build: Copied ${relativePath} => dist/${relativePath}`);
        }
      });
    } else {
      const compiler = webpack({
        target: 'node',
        mode: 'production',
        entry: inputPath,
        output: {
          path: outputPath,
          filename: basename,
          libraryTarget: 'commonjs2'
        }
      });

      compiler.run((err, stats) => {
        if (err) {
          console.error(err.message);
        } else {
          console.log(
            stats.toString({
              colors: true
            })
          );
        }
      });
    }
  }
}

main().catch(e => console.error(e.message));
