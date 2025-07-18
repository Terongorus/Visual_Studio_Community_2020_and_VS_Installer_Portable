// @ts-check
"use strict";
var EOL = require('os').EOL;
var fs = require('fs');
var path = require('path');
// Choose 'tap' rather than 'min' or 'xunit'. The reason is that
// 'min' produces undisplayable text to stdout and stderr under piped/redirect, 
// and 'xunit' does not print the stack trace from the test.
var defaultMochaOptions = { ui: 'tdd', reporter: 'tap', timeout: 2000 };

var find_tests = function (testFileList, discoverResultFile, projectFolder) {
    return new Promise(resolve => {
        var Mocha = detectMocha(projectFolder);
        if (!Mocha) {
            return resolve();
        }

        function getTestList(suite, testFile) {
            if (suite) {
                if (suite.tests && suite.tests.length !== 0) {
                    suite.tests.forEach(function (t, i, testArray) {
                        testList.push({
                            name: t.title,
                            suite: suite.fullTitle(),
                            filepath: testFile,
                            line: 0,
                            column: 0
                        });
                    });
                }

                if (suite.suites) {
                    suite.suites.forEach(function (s, i, suiteArray) {
                        getTestList(s, testFile);
                    });
                }
            }
        }

        var testList = [];
        testFileList.split(';').forEach(function (testFile) {
            var mocha = initializeMocha(Mocha, projectFolder);
            process.chdir(path.dirname(testFile));

            try {
                mocha.addFile(testFile);
                mocha.loadFiles();
                getTestList(mocha.suite, testFile);
            } catch (e) {
                //we would like continue discover other files, so swallow, log and continue;
                console.error("Test discovery error:", e, "in", testFile);
            }
        });

        var fd = fs.openSync(discoverResultFile, 'w');
        fs.writeSync(fd, JSON.stringify(testList));
        fs.closeSync(fd);

        resolve();
    });
};

module.exports.find_tests = find_tests;

var run_tests = function (context) {
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    return new Promise(resolve => {
        var Mocha = detectMocha(context.testCases[0].projectFolder);
        if (!Mocha) {
            return resolve();
        }

        var mocha = initializeMocha(Mocha, context.testCases[0].projectFolder);

        var testGrepString = '^(' + context.testCases.map(function (testCase) {
            return escapeRegExp(testCase.fullTitle);
        }).join('|') + ')$';

        if (testGrepString) {
            mocha.grep(new RegExp(testGrepString));
        }
        mocha.addFile(context.testCases[0].testFile);

        var runner = mocha.run(function (code) {
            process.exitCode = code ? code : 0;
        });

        // See events available at https://github.com/mochajs/mocha/blob/8cae7a34f0b6eafeb16567beb8852b827cc5956b/lib/runner.js#L47-L57
        runner.on('pending', function (test) {
            const fullyQualifiedName = context.getFullyQualifiedName(test.fullTitle());
            context.post({
                type: 'pending',
                fullyQualifiedName,
                result: {
                    fullyQualifiedName,
                    pending: true
                }
            });
            context.clearOutputs();
        });

        runner.on('test', function (test) {
            context.post({
                type: 'test start',
                fullyQualifiedName: context.getFullyQualifiedName(test.fullTitle())
            });
        });

        runner.on('end', function () {
            context.post({
                type: 'end'
            });

            resolve();
        });

        runner.on('pass', function (test) {
            const fullyQualifiedName = context.getFullyQualifiedName(test.fullTitle());

            context.post({
                type: 'result',
                fullyQualifiedName,
                result: {
                    fullyQualifiedName,
                    passed: true
                }
            });
            context.clearOutputs();
        });

        runner.on('fail', function (test, err) {
            const fullyQualifiedName = context.getFullyQualifiedName(test.fullTitle());

            context.post({
                type: 'result',
                fullyQualifiedName,
                result: {
                    fullyQualifiedName,
                    passed: false
                }
            });
            context.clearOutputs();
        });
    });
};

function logError() {
    var errorArgs = Array.prototype.slice.call(arguments);
    errorArgs.unshift("NTVS_ERROR:");
    console.error.apply(console, errorArgs);
}

function detectMocha(projectFolder) {
    try {
        var node_modulesFolder = projectFolder;
        var mochaJsonPath = path.join(node_modulesFolder, 'test', 'mocha.json');
        if (fs.existsSync(mochaJsonPath)) {
            var opt = require(mochaJsonPath);
            if (opt && opt.path) {
                node_modulesFolder = path.resolve(projectFolder, opt.path);
            }
        }

        var mochaPath = path.join(node_modulesFolder, 'node_modules', 'mocha');
        var Mocha = require(mochaPath);
        return Mocha;
    } catch (ex) {
        logError(
            'Failed to find Mocha package.  Mocha must be installed in the project locally.' + EOL +
            'Install Mocha locally using the npm manager via solution explorer' + EOL +
            'or with ".npm install mocha --save-dev" via the Node.js interactive window.');
        return null;
    }
}

function initializeMocha(Mocha, projectFolder) {
    var mocha = new Mocha();
    applyMochaOptions(mocha, getMochaOptions(projectFolder));
    return mocha;
}

function applyMochaOptions(mocha, options) {
    if (options) {
        for (var opt in options) {
            var mochaOpt = mocha[opt];
            var optValue = options[opt];

            if (typeof mochaOpt === 'function') {
                try {
                    mochaOpt.call(mocha, optValue);
                } catch (e) {
                    console.log("Could not set mocha option '" + opt + "' with value '" + optValue + "' due to error:", e);
                }
            }
        }
    }
}

function getMochaOptions(projectFolder) {
    var mochaOptions = defaultMochaOptions;
    try {
        var optionsPath = path.join(projectFolder, 'test', 'mocha.json');
        var options = require(optionsPath) || {};
        for (var opt in options) {
            mochaOptions[opt] = options[opt];
        }
        console.log("Found mocha.json file. Using Mocha settings: ", mochaOptions);
    } catch (ex) {
        console.log("Using default Mocha settings");
    }

    // set timeout to 10 minutes, because the default of 2 sec is too short for debugging scenarios
    if (typeof v8debug === 'object') {
        mochaOptions['timeout'] = 600000;
    }

    return mochaOptions;
}

module.exports.run_tests = run_tests;
// SIG // Begin signature block
// SIG // MIIoUAYJKoZIhvcNAQcCoIIoQTCCKD0CAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // +t7HlAUsJCRV31OHF0Fw80Msm15+G4PjnqeVDhBjqDOg
// SIG // gg2FMIIGAzCCA+ugAwIBAgITMwAABAO91ZVdDzsYrQAA
// SIG // AAAEAzANBgkqhkiG9w0BAQsFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTI0MDkxMjIwMTExM1oX
// SIG // DTI1MDkxMTIwMTExM1owdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // n3RnXcCDp20WFMoNNzt4s9fV12T5roRJlv+bshDfvJoM
// SIG // ZfhyRnixgUfGAbrRlS1St/EcXFXD2MhRkF3CnMYIoeMO
// SIG // MuMyYtxr2sC2B5bDRMUMM/r9I4GP2nowUthCWKFIS1RP
// SIG // lM0YoVfKKMaH7bJii29sW+waBUulAKN2c+Gn5znaiOxR
// SIG // qIu4OL8f9DCHYpME5+Teek3SL95sH5GQhZq7CqTdM0fB
// SIG // w/FmLLx98SpBu7v8XapoTz6jJpyNozhcP/59mi/Fu4tT
// SIG // 2rI2vD50Vx/0GlR9DNZ2py/iyPU7DG/3p1n1zluuRp3u
// SIG // XKjDfVKH7xDbXcMBJid22a3CPbuC2QJLowIDAQABo4IB
// SIG // gjCCAX4wHwYDVR0lBBgwFgYKKwYBBAGCN0wIAQYIKwYB
// SIG // BQUHAwMwHQYDVR0OBBYEFOpuKgJKc+OuNYitoqxfHlrE
// SIG // gXAZMFQGA1UdEQRNMEukSTBHMS0wKwYDVQQLEyRNaWNy
// SIG // b3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQx
// SIG // FjAUBgNVBAUTDTIzMDAxMis1MDI5MjYwHwYDVR0jBBgw
// SIG // FoAUSG5k5VAF04KqFzc3IrVtqMp1ApUwVAYDVR0fBE0w
// SIG // SzBJoEegRYZDaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jcmwvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNybDBhBggrBgEFBQcBAQRVMFMwUQYIKwYB
// SIG // BQUHMAKGRWh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9w
// SIG // a2lvcHMvY2VydHMvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3
// SIG // DQEBCwUAA4ICAQBRaP+hOC1+dSKhbqCr1LIvNEMrRiOQ
// SIG // EkPc7D6QWtM+/IbrYiXesNeeCZHCMf3+6xASuDYQ+AyB
// SIG // TX0YlXSOxGnBLOzgEukBxezbfnhUTTk7YB2/TxMUcuBC
// SIG // P45zMM0CVTaJE8btloB6/3wbFrOhvQHCILx41jTd6kUq
// SIG // 4bIBHah3NG0Q1H/FCCwHRGTjAbyiwq5n/pCTxLz5XYCu
// SIG // 4RTvy/ZJnFXuuwZynowyju90muegCToTOwpHgE6yRcTv
// SIG // Ri16LKCr68Ab8p8QINfFvqWoEwJCXn853rlkpp4k7qzw
// SIG // lBNiZ71uw2pbzjQzrRtNbCFQAfmoTtsHFD2tmZvQIg1Q
// SIG // VkzM/V1KCjHL54ItqKm7Ay4WyvqWK0VIEaTbdMtbMWbF
// SIG // zq2hkRfJTNnFr7RJFeVC/k0DNaab+bpwx5FvCUvkJ3z2
// SIG // wfHWVUckZjEOGmP7cecefrF+rHpif/xW4nJUjMUiPsyD
// SIG // btY2Hq3VMLgovj+qe0pkJgpYQzPukPm7RNhbabFNFvq+
// SIG // kXWBX/z/pyuo9qLZfTb697Vi7vll5s/DBjPtfMpyfpWG
// SIG // 0phVnAI+0mM4gH09LCMJUERZMgu9bbCGVIQR7cT5YhlL
// SIG // t+tpSDtC6XtAzq4PJbKZxFjpB5wk+SRJ1gm87olbfEV9
// SIG // SFdO7iL3jWbjgVi1Qs1iYxBmvh4WhLWr48uouzCCB3ow
// SIG // ggVioAMCAQICCmEOkNIAAAAAAAMwDQYJKoZIhvcNAQEL
// SIG // BQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMT
// SIG // KU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhv
// SIG // cml0eSAyMDExMB4XDTExMDcwODIwNTkwOVoXDTI2MDcw
// SIG // ODIxMDkwOVowfjELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYG
// SIG // A1UEAxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0Eg
// SIG // MjAxMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoC
// SIG // ggIBAKvw+nIQHC6t2G6qghBNNLrytlghn0IbKmvpWlCq
// SIG // uAY4GgRJun/DDB7dN2vGEtgL8DjCmQawyDnVARQxQtOJ
// SIG // DXlkh36UYCRsr55JnOloXtLfm1OyCizDr9mpK656Ca/X
// SIG // llnKYBoF6WZ26DJSJhIv56sIUM+zRLdd2MQuA3WraPPL
// SIG // bfM6XKEW9Ea64DhkrG5kNXimoGMPLdNAk/jj3gcN1Vx5
// SIG // pUkp5w2+oBN3vpQ97/vjK1oQH01WKKJ6cuASOrdJXtjt
// SIG // 7UORg9l7snuGG9k+sYxd6IlPhBryoS9Z5JA7La4zWMW3
// SIG // Pv4y07MDPbGyr5I4ftKdgCz1TlaRITUlwzluZH9TupwP
// SIG // rRkjhMv0ugOGjfdf8NBSv4yUh7zAIXQlXxgotswnKDgl
// SIG // mDlKNs98sZKuHCOnqWbsYR9q4ShJnV+I4iVd0yFLPlLE
// SIG // tVc/JAPw0XpbL9Uj43BdD1FGd7P4AOG8rAKCX9vAFbO9
// SIG // G9RVS+c5oQ/pI0m8GLhEfEXkwcNyeuBy5yTfv0aZxe/C
// SIG // HFfbg43sTUkwp6uO3+xbn6/83bBm4sGXgXvt1u1L50kp
// SIG // pxMopqd9Z4DmimJ4X7IvhNdXnFy/dygo8e1twyiPLI9A
// SIG // N0/B4YVEicQJTMXUpUMvdJX3bvh4IFgsE11glZo+TzOE
// SIG // 2rCIF96eTvSWsLxGoGyY0uDWiIwLAgMBAAGjggHtMIIB
// SIG // 6TAQBgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4EFgQUSG5k
// SIG // 5VAF04KqFzc3IrVtqMp1ApUwGQYJKwYBBAGCNxQCBAwe
// SIG // CgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB
// SIG // /wQFMAMBAf8wHwYDVR0jBBgwFoAUci06AjGQQ7kUBU7h
// SIG // 6qfHMdEjiTQwWgYDVR0fBFMwUTBPoE2gS4ZJaHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvTWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNy
// SIG // bDBeBggrBgEFBQcBAQRSMFAwTgYIKwYBBQUHMAKGQmh0
// SIG // dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMv
// SIG // TWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNydDCB
// SIG // nwYDVR0gBIGXMIGUMIGRBgkrBgEEAYI3LgMwgYMwPwYI
// SIG // KwYBBQUHAgEWM2h0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvZG9jcy9wcmltYXJ5Y3BzLmh0bTBABggr
// SIG // BgEFBQcCAjA0HjIgHQBMAGUAZwBhAGwAXwBwAG8AbABp
// SIG // AGMAeQBfAHMAdABhAHQAZQBtAGUAbgB0AC4gHTANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAZ/KGpZjgVHkaLtPYdGcimwuW
// SIG // EeFjkplCln3SeQyQwWVfLiw++MNy0W2D/r4/6ArKO79H
// SIG // qaPzadtjvyI1pZddZYSQfYtGUFXYDJJ80hpLHPM8QotS
// SIG // 0LD9a+M+By4pm+Y9G6XUtR13lDni6WTJRD14eiPzE32m
// SIG // kHSDjfTLJgJGKsKKELukqQUMm+1o+mgulaAqPyprWElj
// SIG // HwlpblqYluSD9MCP80Yr3vw70L01724lruWvJ+3Q3fMO
// SIG // r5kol5hNDj0L8giJ1h/DMhji8MUtzluetEk5CsYKwsat
// SIG // ruWy2dsViFFFWDgycScaf7H0J/jeLDogaZiyWYlobm+n
// SIG // t3TDQAUGpgEqKD6CPxNNZgvAs0314Y9/HG8VfUWnduVA
// SIG // KmWjw11SYobDHWM2l4bf2vP48hahmifhzaWX0O5dY0Hj
// SIG // Wwechz4GdwbRBrF1HxS+YWG18NzGGwS+30HHDiju3mUv
// SIG // 7Jf2oVyW2ADWoUa9WfOXpQlLSBCZgB/QACnFsZulP0V3
// SIG // HjXG0qKin3p6IvpIlR+r+0cjgPWe+L9rt0uX4ut1eBrs
// SIG // 6jeZeRhL/9azI2h15q/6/IvrC4DqaTuv/DDtBEyO3991
// SIG // bWORPdGdVk5Pv4BXIqF4ETIheu9BCrE/+6jMpF3BoYib
// SIG // V3FWTkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0x
// SIG // ghojMIIaHwIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAAEA73VlV0POxitAAAAAAQDMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCCl2oSVCJtRe/O/
// SIG // 1sutiTxZ0D7OXF0FnCFno5Ajta/IwzBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBABRr9B4S5PuegbG1BtxhlweATM9UmDni
// SIG // dqcKwrSHwq3wRtj7HkHn9ynhdP/W23xIi9GbkMNu9ByP
// SIG // sGE7H+MGPaRYviG+k2ylumwsJSGMZWZuRGXMne95W/a9
// SIG // gV0wqtuDKILQ5DATlerE1p21rGraZuOKB6vcmcoNimKp
// SIG // cm4b7Sqor2ON3mb7T/3tb7yYpOQHkweDzrUH65WHySZ4
// SIG // oMCk2VRfFJIcvvyIRSIh1Ro70l45xTc9mbXa/8bEoIlB
// SIG // 7s6uc5zKBW1pr+vPbGjJCL2W3ocih5P3/VwZOXrSFy/9
// SIG // 5FQyeFWvnmnSg4EQUt+Sqn66RL+LGqjPJiAGrPXBae1t
// SIG // LXahghetMIIXqQYKKwYBBAGCNwMDATGCF5kwgheVBgkq
// SIG // hkiG9w0BBwKggheGMIIXggIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBWgYLKoZIhvcNAQkQAQSgggFJBIIBRTCCAUEC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // STVsihDqJNm7sddHgR182n2Vb4vVjpndc+fKT3V3JwkC
// SIG // Bme2KwJdnRgTMjAyNTA0MDEwOTE1MzcuNDA4WjAEgAIB
// SIG // 9KCB2aSB1jCB0zELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEtMCsG
// SIG // A1UECxMkTWljcm9zb2Z0IElyZWxhbmQgT3BlcmF0aW9u
// SIG // cyBMaW1pdGVkMScwJQYDVQQLEx5uU2hpZWxkIFRTUyBF
// SIG // U046NTkxQS0wNUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jv
// SIG // c29mdCBUaW1lLVN0YW1wIFNlcnZpY2WgghH7MIIHKDCC
// SIG // BRCgAwIBAgITMwAAAfQXRoXAyz855QABAAAB9DANBgkq
// SIG // hkiG9w0BAQsFADB8MQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYw
// SIG // JAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0Eg
// SIG // MjAxMDAeFw0yNDA3MjUxODMwNTlaFw0yNTEwMjIxODMw
// SIG // NTlaMIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQL
// SIG // EyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExp
// SIG // bWl0ZWQxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVTTjo1
// SIG // OTFBLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9zb2Z0
// SIG // IFRpbWUtU3RhbXAgU2VydmljZTCCAiIwDQYJKoZIhvcN
// SIG // AQEBBQADggIPADCCAgoCggIBAKcIThOm0IAvaquIyRl9
// SIG // gNcqDm35NKnrUPJJI/uZt+1gcQ5bGeaCZ438x7Kaj4jh
// SIG // Fc2dstsoBoDWd/8XWUDe3/QNVqdQHYeah12WYd0gV/AA
// SIG // bnOvU293CeSgmXFw7Ln8Jl3go/NRMyRCGarlXVfEk5UL
// SIG // ngf29TCGLeUSorN7sM3ZX0pdHJB2xs6DvdWEyoOiBMai
// SIG // mKIxq3gqKZyCsTr5K+VWbI9n/eQW9SxhL7oQSJvwuycr
// SIG // LybwWVjba7Kc8l1Z7qPpAxMmcKZKYbEfGb3YvrP6UIqH
// SIG // 5nW1tVKs1pal0FYKGF22mJBMmkof4XgbcI9bbnvi3Ljn
// SIG // BwD4G8Gb0C5LCmiuOqJLa3oDkeHtInLBogFkfSC/p8uJ
// SIG // pQlDQPOBexhBFjhL4m4oO8LK02umW87jLMk4tgM+Kj1d
// SIG // 0EZBYMUm6eEeDhCp4p/Cc+FyyNcF4QYSKTBnwNwU/OdJ
// SIG // 6mps0og+S+acflbXwotDCU0tiwxdT2lWcJclWSFY1Ryv
// SIG // KIdh2BvU9uhY0ffyPOYuRMcZoR6cTNmflISXmQOi8+Od
// SIG // pv/sawOMa3WGrOXJuxVIctuKzy1R/hcvmcsBwKfXPaFk
// SIG // 67Y3yCqiyL2LYCXONUPFsW2T0ewdbn7fARbL89nTki5M
// SIG // Twy3F1stegDcu979IqQsQMFBAvYbLItC3QfE4YjX/+AP
// SIG // kWfLAgMBAAGjggFJMIIBRTAdBgNVHQ4EFgQUK3RloQrR
// SIG // LD4ndSyc7E2i0ykG35swHwYDVR0jBBgwFoAUn6cVXQBe
// SIG // Yl2D9OXSZacbUzUZ6XIwXwYDVR0fBFgwVjBUoFKgUIZO
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9j
// SIG // cmwvTWljcm9zb2Z0JTIwVGltZS1TdGFtcCUyMFBDQSUy
// SIG // MDIwMTAoMSkuY3JsMGwGCCsGAQUFBwEBBGAwXjBcBggr
// SIG // BgEFBQcwAoZQaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jZXJ0cy9NaWNyb3NvZnQlMjBUaW1lLVN0
// SIG // YW1wJTIwUENBJTIwMjAxMCgxKS5jcnQwDAYDVR0TAQH/
// SIG // BAIwADAWBgNVHSUBAf8EDDAKBggrBgEFBQcDCDAOBgNV
// SIG // HQ8BAf8EBAMCB4AwDQYJKoZIhvcNAQELBQADggIBAN3B
// SIG // 0g8SSlA7IGnCH0V+tLoDg0obAasLRFEVG1F3g5mGEmua
// SIG // BY9+Ebo1t4DngrfzmwzuOb36Z2BuTkuWKMMLBcNfYIgi
// SIG // OiVfnHBv6qjNPJ8QEm88FraraK80IiYfbqbBOE1WXimF
// SIG // 5m8se1jfbXW1SKwnpVY+z+onzB00i7egZsqEtsZQtnH4
// SIG // CjzwNd70t3rqlJes8HuxgIY34zV4ypROEjVib3aoK79B
// SIG // lESo6pmpjb4ZkiWp3uk2M6XQwnoKvGnZRh/OSNRFipnx
// SIG // EW9ZcysuTjDtnvSJAJb8naVLp9At7DRLadHoZYk9Eq2q
// SIG // vI3GFQx+ANgvzGywSMIpI8IhRkOEpRS09k4G+Br76XFl
// SIG // cwccA6PSEQcKc54G8s24YfeVFTq0C9q21h6xw0hN3YHS
// SIG // 9srmh0YGOx2GC7OS7bN9MFPTrofDeeEVLWuhhWRceQOL
// SIG // iE4MiXFXVlWjdKo7NHhI8BMjVL9HES7h1iQXo5DHt6kQ
// SIG // Ibwo54a6OwxkVmiJXcn82apZ+hbJy0N25fmb1SVk2Cbi
// SIG // /iGSyNkotyKyEX43HJ9vV9gV/789inGLmyIyul32L62U
// SIG // DeFym570qgTQMCD2NsSXgeKPTwxBSNq3D2i1Ms+SFeyT
// SIG // 9yUaYIN8bFKrxR5UhurjCFo8B9BkCCMKwts0cvpTWbDi
// SIG // p67sshzEEz+48uVPdqhBMIIHcTCCBVmgAwIBAgITMwAA
// SIG // ABXF52ueAptJmQAAAAAAFTANBgkqhkiG9w0BAQsFADCB
// SIG // iDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEyMDAGA1UEAxMpTWlj
// SIG // cm9zb2Z0IFJvb3QgQ2VydGlmaWNhdGUgQXV0aG9yaXR5
// SIG // IDIwMTAwHhcNMjEwOTMwMTgyMjI1WhcNMzAwOTMwMTgz
// SIG // MjI1WjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQD
// SIG // Ex1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDCC
// SIG // AiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAOTh
// SIG // pkzntHIhC3miy9ckeb0O1YLT/e6cBwfSqWxOdcjKNVf2
// SIG // AX9sSuDivbk+F2Az/1xPx2b3lVNxWuJ+Slr+uDZnhUYj
// SIG // DLWNE893MsAQGOhgfWpSg0S3po5GawcU88V29YZQ3MFE
// SIG // yHFcUTE3oAo4bo3t1w/YJlN8OWECesSq/XJprx2rrPY2
// SIG // vjUmZNqYO7oaezOtgFt+jBAcnVL+tuhiJdxqD89d9P6O
// SIG // U8/W7IVWTe/dvI2k45GPsjksUZzpcGkNyjYtcI4xyDUo
// SIG // veO0hyTD4MmPfrVUj9z6BVWYbWg7mka97aSueik3rMvr
// SIG // g0XnRm7KMtXAhjBcTyziYrLNueKNiOSWrAFKu75xqRdb
// SIG // Z2De+JKRHh09/SDPc31BmkZ1zcRfNN0Sidb9pSB9fvzZ
// SIG // nkXftnIv231fgLrbqn427DZM9ituqBJR6L8FA6PRc6ZN
// SIG // N3SUHDSCD/AQ8rdHGO2n6Jl8P0zbr17C89XYcz1DTsEz
// SIG // OUyOArxCaC4Q6oRRRuLRvWoYWmEBc8pnol7XKHYC4jMY
// SIG // ctenIPDC+hIK12NvDMk2ZItboKaDIV1fMHSRlJTYuVD5
// SIG // C4lh8zYGNRiER9vcG9H9stQcxWv2XFJRXRLbJbqvUAV6
// SIG // bMURHXLvjflSxIUXk8A8FdsaN8cIFRg/eKtFtvUeh17a
// SIG // j54WcmnGrnu3tz5q4i6tAgMBAAGjggHdMIIB2TASBgkr
// SIG // BgEEAYI3FQEEBQIDAQABMCMGCSsGAQQBgjcVAgQWBBQq
// SIG // p1L+ZMSavoKRPEY1Kc8Q/y8E7jAdBgNVHQ4EFgQUn6cV
// SIG // XQBeYl2D9OXSZacbUzUZ6XIwXAYDVR0gBFUwUzBRBgwr
// SIG // BgEEAYI3TIN9AQEwQTA/BggrBgEFBQcCARYzaHR0cDov
// SIG // L3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9Eb2NzL1Jl
// SIG // cG9zaXRvcnkuaHRtMBMGA1UdJQQMMAoGCCsGAQUFBwMI
// SIG // MBkGCSsGAQQBgjcUAgQMHgoAUwB1AGIAQwBBMAsGA1Ud
// SIG // DwQEAwIBhjAPBgNVHRMBAf8EBTADAQH/MB8GA1UdIwQY
// SIG // MBaAFNX2VsuP6KJcYmjRPZSQW9fOmhjEMFYGA1UdHwRP
// SIG // ME0wS6BJoEeGRWh0dHA6Ly9jcmwubWljcm9zb2Z0LmNv
// SIG // bS9wa2kvY3JsL3Byb2R1Y3RzL01pY1Jvb0NlckF1dF8y
// SIG // MDEwLTA2LTIzLmNybDBaBggrBgEFBQcBAQROMEwwSgYI
// SIG // KwYBBQUHMAKGPmh0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2kvY2VydHMvTWljUm9vQ2VyQXV0XzIwMTAtMDYt
// SIG // MjMuY3J0MA0GCSqGSIb3DQEBCwUAA4ICAQCdVX38Kq3h
// SIG // LB9nATEkW+Geckv8qW/qXBS2Pk5HZHixBpOXPTEztTnX
// SIG // wnE2P9pkbHzQdTltuw8x5MKP+2zRoZQYIu7pZmc6U03d
// SIG // mLq2HnjYNi6cqYJWAAOwBb6J6Gngugnue99qb74py27Y
// SIG // P0h1AdkY3m2CDPVtI1TkeFN1JFe53Z/zjj3G82jfZfak
// SIG // Vqr3lbYoVSfQJL1AoL8ZthISEV09J+BAljis9/kpicO8
// SIG // F7BUhUKz/AyeixmJ5/ALaoHCgRlCGVJ1ijbCHcNhcy4s
// SIG // a3tuPywJeBTpkbKpW99Jo3QMvOyRgNI95ko+ZjtPu4b6
// SIG // MhrZlvSP9pEB9s7GdP32THJvEKt1MMU0sHrYUP4KWN1A
// SIG // PMdUbZ1jdEgssU5HLcEUBHG/ZPkkvnNtyo4JvbMBV0lU
// SIG // ZNlz138eW0QBjloZkWsNn6Qo3GcZKCS6OEuabvshVGtq
// SIG // RRFHqfG3rsjoiV5PndLQTHa1V1QJsWkBRH58oWFsc/4K
// SIG // u+xBZj1p/cvBQUl+fpO+y/g75LcVv7TOPqUxUYS8vwLB
// SIG // gqJ7Fx0ViY1w/ue10CgaiQuPNtq6TPmb/wrpNPgkNWcr
// SIG // 4A245oyZ1uEi6vAnQj0llOZ0dFtq0Z4+7X6gMTN9vMvp
// SIG // e784cETRkPHIqzqKOghif9lwY1NNje6CbaUFEMFxBmoQ
// SIG // tB1VM1izoXBm8qGCA1YwggI+AgEBMIIBAaGB2aSB1jCB
// SIG // 0zELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEtMCsGA1UECxMkTWlj
// SIG // cm9zb2Z0IElyZWxhbmQgT3BlcmF0aW9ucyBMaW1pdGVk
// SIG // MScwJQYDVQQLEx5uU2hpZWxkIFRTUyBFU046NTkxQS0w
// SIG // NUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1l
// SIG // LVN0YW1wIFNlcnZpY2WiIwoBATAHBgUrDgMCGgMVAL/i
// SIG // 2f1YNLNe13pOIhvUfXP+/gCOoIGDMIGApH4wfDELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0
// SIG // IFRpbWUtU3RhbXAgUENBIDIwMTAwDQYJKoZIhvcNAQEL
// SIG // BQACBQDrlgsBMCIYDzIwMjUwNDAxMDY0OTM3WhgPMjAy
// SIG // NTA0MDIwNjQ5MzdaMHQwOgYKKwYBBAGEWQoEATEsMCow
// SIG // CgIFAOuWCwECAQAwBwIBAAICBc4wBwIBAAICEuYwCgIF
// SIG // AOuXXIECAQAwNgYKKwYBBAGEWQoEAjEoMCYwDAYKKwYB
// SIG // BAGEWQoDAqAKMAgCAQACAwehIKEKMAgCAQACAwGGoDAN
// SIG // BgkqhkiG9w0BAQsFAAOCAQEAWVvnr2vSKZn7t3F7ks65
// SIG // Lxw9w3w9BhWXhfcLmisXrb6mKnbkR/sZprrsNj6Trm2A
// SIG // hTl4lIbRK6gOJVY7HQyEUy5y8JNac8bILOdi3VJnkXKQ
// SIG // 7Eet9/vx3r4CsmdFqf0hyVMgg++tv4f+XSor5P/j5vUr
// SIG // yOd5lhxOsJymJUqeczlu7bcmdKD4oXtCj2WFNuFpgF2p
// SIG // AKDgJf1rWH1ANnwPha472Jv865rm/JQtEfVg6Bu3s+eT
// SIG // 2e6LmqMhmpL3e4vqQOrJjybRr7cz5Seo6nDUDz8EHPyZ
// SIG // UUa33eQrbSTQL3yPOg9Idj07LUQu5lnw8PD7PQNFREHA
// SIG // hJXcOyyBhsDj/jGCBA0wggQJAgEBMIGTMHwxCzAJBgNV
// SIG // BAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYD
// SIG // VQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQg
// SIG // Q29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBU
// SIG // aW1lLVN0YW1wIFBDQSAyMDEwAhMzAAAB9BdGhcDLPznl
// SIG // AAEAAAH0MA0GCWCGSAFlAwQCAQUAoIIBSjAaBgkqhkiG
// SIG // 9w0BCQMxDQYLKoZIhvcNAQkQAQQwLwYJKoZIhvcNAQkE
// SIG // MSIEIKR2nabFTHuZGGWICCKB8yw/Nwyj/3xHsYgD1bA+
// SIG // inzzMIH6BgsqhkiG9w0BCRACLzGB6jCB5zCB5DCBvQQg
// SIG // P1jCfG4mk+p475JJwfEO4UkCIvMrOryAb2YOtEQY1msw
// SIG // gZgwgYCkfjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMK
// SIG // V2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwG
// SIG // A1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYD
// SIG // VQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAx
// SIG // MAITMwAAAfQXRoXAyz855QABAAAB9DAiBCBg2KtanKLQ
// SIG // 3LBGo6z+8xSLWmuWgoUdwelENP6DZ8tpLDANBgkqhkiG
// SIG // 9w0BAQsFAASCAgBjwWzy904wAlwszo3w/tVHknyzAHnz
// SIG // vviVrre3eQ4cgCEE+XgUQDxduHOBVRTFqI6Q4QJys00n
// SIG // wM32ErImQOq9hVH16EpKwsNku9yTw9p4bkK0XVcEtp2I
// SIG // KgphUyXAC+yBVuNRKB+QV5YOzqFn3JVIQE5kiHVv/7bL
// SIG // k4sGOqHzgVlV5ZcsQStVtNuInIksjsmSWtyFEK8kwGa1
// SIG // Kxin3zxNea29+S04HC3aTPxR34U2HO5xi68m0R40k626
// SIG // Pj2jFYSHEXNhV7LFzsNh1KNkxXuJitOO8+T2yC/oWhMV
// SIG // E+HjAhtnqwk9obj4y2jr89HMi75fuq/MYsZOPsQsFm6d
// SIG // v9+UBZc36Z5yGFv3QtFxDl4y6RSSXK8F00KDwwBQY/Nj
// SIG // M4DyD++vbvXmLtSqo2TFBYwiEZ98PGx9XmZSgJMI3/nD
// SIG // UO/cwbxYDXHpS37K/2utFGxyUtb93d0Xc4yDiFJZAqP3
// SIG // ngjaIXObCeHttSx3n5e9ckCvvAyVae6vyYnGBJvxUDfW
// SIG // 9mFmXgrVxZ6zt2ZiEd4mAPbFtilwrPwOMhBDuHWzTWqO
// SIG // AH13KWV3Z7st0mwj4mQ6oa6qlRXO800Qimg/eYX6G6X9
// SIG // RYBoTVklFfGKXto+JGfee0LibLwZS3Dqvbf3vpMGxhrZ
// SIG // G0BiopdO64bid4VhgzoFiNgZVdpUn8InFXfwtA==
// SIG // End signature block
