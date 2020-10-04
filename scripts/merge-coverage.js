/**
 * based on https://github.com/istanbuljs/istanbuljs/blob/1fe490e51909607137ded25b1688581c9fd926cd/monorepo-merge-reports.js
 */
const { dirname, basename, join, resolve } = require("path");
const { spawnSync } = require("child_process");

const rimraf = require("rimraf");
const makeDir = require("make-dir");
const glob = require("glob");

process.chdir(resolve(__dirname, ".."));
rimraf.sync(".nyc_output");
makeDir.sync(".nyc_output");

// Merge coverage data from each package so we can generate a complete reports
glob.sync("packages/*/.nyc_output").forEach((nycOutput) => {
    const cwd = dirname(nycOutput);
    const { status, stderr } = spawnSync(
        resolve("node_modules", ".bin", "nyc"),
        [
            "merge",
            ".nyc_output",
            join(__dirname, "..", ".nyc_output", basename(cwd) + ".json"),
        ],
        {
            encoding: "utf8",
            shell: true,
            cwd,
        }
    );

    if (status !== 0) {
        console.error(stderr);
        process.exit(status);
    }
});

const { status, stderr } = spawnSync(
    resolve("node_modules", ".bin", "nyc"),
    ["report", "--reporter=lcov"],
    {
        encoding: "utf8",
        shell: true,
        cwd: resolve(__dirname, ".."),
    }
);

if (status !== 0) {
    console.error(stderr);
    process.exit(status);
}