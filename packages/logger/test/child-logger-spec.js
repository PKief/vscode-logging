const { map } = require("lodash");
const { expect } = require("chai");
const proxyquire = require("proxyquire").noCallThru();

const { VSCodeStub } = require("./stubs/vscode-stub");

describe("VSCode Extension Logger", () => {
  context("childLogger capabilities", () => {
    /**
     * @type {typeof import("../api").getExtensionLogger}
     */
    let getExtensionLogger;
    let vsCodeStub;
    beforeEach(() => {
      // VSCode outChannel is always enabled so we still need a stub for it
      // even if we are only interested in the rolling File Logger
      vsCodeStub = new VSCodeStub();
      const mainModuleStubbed = proxyquire("../lib/api.js", {
        vscode: vsCodeStub
      });
      getExtensionLogger = mainModuleStubbed.getExtensionLogger;
    });

    it("will log to childLogger", () => {
      const extLogger = getExtensionLogger({
        extName: "MyExtName",
        level: "error"
      });

      const childLogger = extLogger.getChildLogger({ label: "myLibName" });
      childLogger.fatal("Oops I did it again!");

      const logEntries = map(vsCodeStub.lines, JSON.parse);
      expect(logEntries)
        .excluding("time")
        .to.deep.eql([
          {
            label: "MyExtName.myLibName",
            level: "fatal",
            message: "Oops I did it again!"
          }
        ]);
    });

    it("will handle logging level at the root Logger of all childLoggers", () => {
      const extLogger = getExtensionLogger({
        extName: "MyExtName",
        level: "error"
      });

      const childLogger = extLogger.getChildLogger({ label: "myLibName" });
      childLogger.warn("Oops I did it again!");
      // nothing logged, warn < 'error'
      expect(vsCodeStub.lines).to.be.empty;

      extLogger.changeLevel("info");

      // Changes on the root affected the level of the child...
      childLogger.warn("Oops I did it again!");
      const logEntries = map(vsCodeStub.lines, JSON.parse);
      expect(logEntries)
        .excluding("time")
        .to.deep.eql([
          {
            label: "MyExtName.myLibName",
            level: "warn",
            message: "Oops I did it again!"
          }
        ]);
    });

    it("will cache and re-use the same childLogger for the same label", () => {
      const extLogger = getExtensionLogger({
        extName: "MyExtName",
        level: "error"
      });

      const childLogger = extLogger.getChildLogger({ label: "myLibName" });
      const childLoggerSameLabel = extLogger.getChildLogger({
        label: "myLibName"
      });
      expect(childLogger).to.equal(childLoggerSameLabel);
    });
  });
});