"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindCommand = void 0;
const chalk_1 = require("chalk");
const artifact_1 = require("../../artifacts/artifact");
const i18n_1 = require("../../i18n");
const main_1 = require("../../main");
const command_1 = require("../command");
const console_table_1 = require("../console-table");
const styling_1 = require("../styling");
const project_1 = require("../switches/project");
const version_1 = require("../switches/version");
class FindCommand extends command_1.Command {
    command = 'find';
    version = new version_1.Version(this);
    project = new project_1.Project(this);
    async run() {
        // load registries (from the current project too if available)
        const resolver = main_1.session.globalRegistryResolver.with(await (0, artifact_1.buildRegistryResolver)(main_1.session, (await this.project.manifest)?.metadata.registries));
        const table = new console_table_1.Table((0, i18n_1.i) `Artifact`, (0, i18n_1.i) `Version`, (0, i18n_1.i) `Summary`);
        let anyEntries = false;
        for (const each of this.inputs) {
            const hasColon = each.indexOf(':') > -1;
            // eslint-disable-next-line prefer-const
            for (let [display, artifactVersions] of await resolver.search({
                // use keyword search if no registry is specified
                keyword: hasColon ? undefined : each,
                // otherwise use the criteria as an id
                idOrShortName: hasColon ? each : undefined,
                version: this.version.value
            })) {
                if (!this.version.isRangeOfVersions) {
                    // if the user didn't specify a range, just show the latest version that was returned
                    artifactVersions.splice(1);
                }
                for (const result of artifactVersions) {
                    if (!result.metadata.dependencyOnly) {
                        anyEntries = true;
                        table.push(display, result.metadata.version, result.metadata.summary || '');
                    }
                }
            }
        }
        if (!anyEntries) {
            (0, styling_1.error)((0, i18n_1.i) `No artifacts found matching criteria: ${chalk_1.cyan.bold(this.inputs.join(', '))}`);
            return false;
        }
        (0, styling_1.log)(table.toString());
        (0, styling_1.log)();
        return true;
    }
}
exports.FindCommand = FindCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZC5qcyIsInNvdXJjZVJvb3QiOiJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbWljcm9zb2Z0L3ZjcGtnLXRvb2wvbWFpbi92Y3BrZy1hcnRpZmFjdHMvIiwic291cmNlcyI6WyJjbGkvY29tbWFuZHMvZmluZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsdUNBQXVDO0FBQ3ZDLGtDQUFrQzs7O0FBR2xDLGlDQUE2QjtBQUM3Qix1REFBaUU7QUFDakUscUNBQStCO0FBQy9CLHFDQUFxQztBQUNyQyx3Q0FBcUM7QUFDckMsb0RBQXlDO0FBQ3pDLHdDQUF3QztBQUN4QyxpREFBOEM7QUFDOUMsaURBQThDO0FBRTlDLE1BQWEsV0FBWSxTQUFRLGlCQUFPO0lBQzdCLE9BQU8sR0FBRyxNQUFNLENBQUM7SUFFMUIsT0FBTyxHQUFHLElBQUksaUJBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QixPQUFPLEdBQUcsSUFBSSxpQkFBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRW5CLEtBQUssQ0FBQyxHQUFHO1FBQ2hCLDhEQUE4RDtRQUM5RCxNQUFNLFFBQVEsR0FBRyxjQUFPLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUNsRCxNQUFNLElBQUEsZ0NBQXFCLEVBQUMsY0FBTyxFQUFFLENBQUMsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzVGLE1BQU0sS0FBSyxHQUFHLElBQUkscUJBQUssQ0FBQyxJQUFBLFFBQUMsRUFBQSxVQUFVLEVBQUUsSUFBQSxRQUFDLEVBQUEsU0FBUyxFQUFFLElBQUEsUUFBQyxFQUFBLFNBQVMsQ0FBQyxDQUFDO1FBRTdELElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztRQUN2QixLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDOUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN4Qyx3Q0FBd0M7WUFDeEMsS0FBSyxJQUFJLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLElBQUksTUFBTSxRQUFRLENBQUMsTUFBTSxDQUFDO2dCQUM1RCxpREFBaUQ7Z0JBQ2pELE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSTtnQkFDcEMsc0NBQXNDO2dCQUN0QyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0JBQzFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUs7YUFDNUIsQ0FBQyxFQUFFO2dCQUNGLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixFQUFFO29CQUNuQyxxRkFBcUY7b0JBQ3JGLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDNUI7Z0JBQ0QsS0FBSyxNQUFNLE1BQU0sSUFBSSxnQkFBZ0IsRUFBRTtvQkFDckMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFO3dCQUNuQyxVQUFVLEdBQUcsSUFBSSxDQUFDO3dCQUNsQixLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQztxQkFDN0U7aUJBQ0Y7YUFDRjtTQUNGO1FBRUQsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNmLElBQUEsZUFBSyxFQUFDLElBQUEsUUFBQyxFQUFBLHlDQUF5QyxZQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3JGLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCxJQUFBLGFBQUcsRUFBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUN0QixJQUFBLGFBQUcsR0FBRSxDQUFDO1FBQ04sT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0Y7QUE3Q0Qsa0NBNkNDIn0=
// SIG // Begin signature block
// SIG // MIIoOgYJKoZIhvcNAQcCoIIoKzCCKCcCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // GH71wQeVHBQ8U2H1ocW/JLUPvcsVHLfuGVCLR7vScdeg
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
// SIG // ghoNMIIaCQIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAAEA73VlV0POxitAAAAAAQDMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCBVXHvZz8dumjfH
// SIG // WUa9WilUp9yk+QnBKiMWQHLyROCiFzBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAA1zCj1QeyVH2p1r3XYOAz05yMJluMDg
// SIG // OAIUPZ04LY/B6UnFtfFOunrvkBH3xQFuHWv8DzZoVL1H
// SIG // SLMgQL1X+v+wXyNIqi41bdxYnrIk/zn7Umfgsnf6SnJ2
// SIG // glQhKqQENQrvoLctB3D3iA1m9pdkR45+ahl25GRj1U0K
// SIG // ny9pmA0db4Vd7EwkO7MWDOO5kAXxHHkvqZyTC8YpU91I
// SIG // ri4Gbf9CveVUflzzp7NGGS0T2vGGO+JJcvMRb0Y86r4z
// SIG // DZ1RU/W/8+VF7Vg+qb+ujg37Y/f7IKtt9torZMYCjj+x
// SIG // 8uANbaCoh+EtiUoHXD+/k7Nrbh0CNyLVVsvmqSl8hvPg
// SIG // q4KhgheXMIIXkwYKKwYBBAGCNwMDATGCF4Mwghd/Bgkq
// SIG // hkiG9w0BBwKgghdwMIIXbAIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUgYLKoZIhvcNAQkQAQSgggFBBIIBPTCCATkC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // HYAjcPFVn9i3nmnjlnpox6yDR/13CxHSOHQ8WT+Iv0kC
// SIG // BmffBdyakBgTMjAyNTA0MDExOTU5MzQuMjgyWjAEgAIB
// SIG // 9KCB0aSBzjCByzELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMG
// SIG // A1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9u
// SIG // czEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjg2MDMt
// SIG // MDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloIIR7TCCByAwggUIoAMCAQIC
// SIG // EzMAAAIHLBE5ic2F+8UAAQAAAgcwDQYJKoZIhvcNAQEL
// SIG // BQAwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwHhcN
// SIG // MjUwMTMwMTk0MjUyWhcNMjYwNDIyMTk0MjUyWjCByzEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9z
// SIG // b2Z0IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMe
// SIG // blNoaWVsZCBUU1MgRVNOOjg2MDMtMDVFMC1EOTQ3MSUw
// SIG // IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2
// SIG // aWNlMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKC
// SIG // AgEAxT//enT5nH4Dg3t/57hb3rgbLfyZksUpDp/PWRcr
// SIG // R0Jt+OIi6D6pFcLPgolHo0Gmyn/v3OylNZ6sAJprYj5x
// SIG // vM5uEpffkSWWkOA8d6rQPZnUHUuwoX+mFGz+GfvvJWjW
// SIG // 00IoCaFwps5Vd+L5guM6RaxE+CgAE410jytLELhYSq+5
// SIG // bTWjBRnJV0pyIXJ0nI/UFA1S0KQLCbbCh8hze3De+GhF
// SIG // y6RRnNSPlmBUcWk4Kkj6hkXxH7kNshqwG1oyWDl7nnkw
// SIG // NTFSoVvM80hKX4yniv7dl7ispKQlGip+bPLKjWyN2x7f
// SIG // 6xP6Tc8FpwCs/jzgUWycSJJi/p/xDFYq+bvLslj5dbfP
// SIG // DCuedQBlYfth+M4kdeGA8c8ghvduIGqJyo4nGJ1lATrV
// SIG // 65zyugEvyzemPvCsYdumurymxW82qllwI8xIkPBGPSva
// SIG // WCPygsoIsYw8B31IFUlgsk/CsO5hgclGZkTz8VzjZbjH
// SIG // vz/ArQSTKbofAgVso7xXxZjkjUSvBE5FJpU1AEdQiDmn
// SIG // gaixsLHEoRX8rw0K2woZoV4m+J0TF+VPWK/Xe1XGB5+n
// SIG // mSbIMs4eUCpSGwkAv2L4RSuNnHggQzG3PjreUek/zMHH
// SIG // uY1clQpql1cVjmkHOKwNp1e6JzDmQulLwhvCxhUmQZ49
// SIG // ZaAwy1qPyPkbkaJNo/0OM3DJ8JECAwEAAaOCAUkwggFF
// SIG // MB0GA1UdDgQWBBRytVJiwr160Ar0ffCQatfP+M6NHjAf
// SIG // BgNVHSMEGDAWgBSfpxVdAF5iXYP05dJlpxtTNRnpcjBf
// SIG // BgNVHR8EWDBWMFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBU
// SIG // aW1lLVN0YW1wJTIwUENBJTIwMjAxMCgxKS5jcmwwbAYI
// SIG // KwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAChlBodHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01p
// SIG // Y3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQQ0ElMjAyMDEw
// SIG // KDEpLmNydDAMBgNVHRMBAf8EAjAAMBYGA1UdJQEB/wQM
// SIG // MAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQEAwIHgDANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEA47tKrj254sdLJRIw+49ttuKW
// SIG // Djxk5nQ7ztPmzUQjZGalL9Oz9OJ39SH92P4iRJlGlO8N
// SIG // dhZufNiJqQ/ysNgpV6zSiz0wTup38bzjxrWpaQJeMKqB
// SIG // oGcb6cW9shLpxuMmUOhEDqYNXRPbjl6M3t4A+B47XHO+
// SIG // ZHGvMor6MBCPq4V7lVFge76IOExlMSnZw76ZORkhl5zo
// SIG // Tw4XSHfoOoUcl3WYsIBGvqvTPV3Lc+ExoQ4DihbGMRYV
// SIG // zSWaPSkbhqunr4bcjXbmK5M4w7VkuoFvGpEefVIbixrF
// SIG // avuAIKhGPFpV40BjNjk5MgZ5UC6QfKg+8fY0aWNgqtDl
// SIG // lpStMHx/9c3n61jefm3vO0sNkz3CLnSCZ9/W2wxu2sCj
// SIG // FWAx37DyfGb8YFpGbn+mWQJKYdHmBodyFfOObWi5HSzg
// SIG // r8OPVsaoWuQ5otjo4fBo2ub/ZMmNykxcl90+AtrHMX4K
// SIG // f+sUXfgxjoTVT71T2v98kVKmObOVGKcvA526aVe50Dtr
// SIG // Htx7wkm62/sj8nqG9ZFHzGGvXxNmxLKDGzmh0YBo4vGT
// SIG // 7fyXdmz33UKAR3FDqj8IxwVCHEnO8XSWWI0W+JvNasY5
// SIG // mtwy47jhZYzGU2KL0YhrxDC/cWY9qR0VMr/rOb+1RsHD
// SIG // Oq4zWDOKs2UDOgNkRmCRlO/NBkBtEDvfMPrLnLk1a30w
// SIG // ggdxMIIFWaADAgECAhMzAAAAFcXna54Cm0mZAAAAAAAV
// SIG // MA0GCSqGSIb3DQEBCwUAMIGIMQswCQYDVQQGEwJVUzET
// SIG // MBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVk
// SIG // bW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0
// SIG // aW9uMTIwMAYDVQQDEylNaWNyb3NvZnQgUm9vdCBDZXJ0
// SIG // aWZpY2F0ZSBBdXRob3JpdHkgMjAxMDAeFw0yMTA5MzAx
// SIG // ODIyMjVaFw0zMDA5MzAxODMyMjVaMHwxCzAJBgNVBAYT
// SIG // AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
// SIG // EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
// SIG // cG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1l
// SIG // LVN0YW1wIFBDQSAyMDEwMIICIjANBgkqhkiG9w0BAQEF
// SIG // AAOCAg8AMIICCgKCAgEA5OGmTOe0ciELeaLL1yR5vQ7V
// SIG // gtP97pwHB9KpbE51yMo1V/YBf2xK4OK9uT4XYDP/XE/H
// SIG // ZveVU3Fa4n5KWv64NmeFRiMMtY0Tz3cywBAY6GB9alKD
// SIG // RLemjkZrBxTzxXb1hlDcwUTIcVxRMTegCjhuje3XD9gm
// SIG // U3w5YQJ6xKr9cmmvHaus9ja+NSZk2pg7uhp7M62AW36M
// SIG // EBydUv626GIl3GoPz130/o5Tz9bshVZN7928jaTjkY+y
// SIG // OSxRnOlwaQ3KNi1wjjHINSi947SHJMPgyY9+tVSP3PoF
// SIG // VZhtaDuaRr3tpK56KTesy+uDRedGbsoy1cCGMFxPLOJi
// SIG // ss254o2I5JasAUq7vnGpF1tnYN74kpEeHT39IM9zfUGa
// SIG // RnXNxF803RKJ1v2lIH1+/NmeRd+2ci/bfV+Autuqfjbs
// SIG // Nkz2K26oElHovwUDo9Fzpk03dJQcNIIP8BDyt0cY7afo
// SIG // mXw/TNuvXsLz1dhzPUNOwTM5TI4CvEJoLhDqhFFG4tG9
// SIG // ahhaYQFzymeiXtcodgLiMxhy16cg8ML6EgrXY28MyTZk
// SIG // i1ugpoMhXV8wdJGUlNi5UPkLiWHzNgY1GIRH29wb0f2y
// SIG // 1BzFa/ZcUlFdEtsluq9QBXpsxREdcu+N+VLEhReTwDwV
// SIG // 2xo3xwgVGD94q0W29R6HXtqPnhZyacaue7e3PmriLq0C
// SIG // AwEAAaOCAd0wggHZMBIGCSsGAQQBgjcVAQQFAgMBAAEw
// SIG // IwYJKwYBBAGCNxUCBBYEFCqnUv5kxJq+gpE8RjUpzxD/
// SIG // LwTuMB0GA1UdDgQWBBSfpxVdAF5iXYP05dJlpxtTNRnp
// SIG // cjBcBgNVHSAEVTBTMFEGDCsGAQQBgjdMg30BATBBMD8G
// SIG // CCsGAQUFBwIBFjNodHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpb3BzL0RvY3MvUmVwb3NpdG9yeS5odG0wEwYD
// SIG // VR0lBAwwCgYIKwYBBQUHAwgwGQYJKwYBBAGCNxQCBAwe
// SIG // CgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB
// SIG // /wQFMAMBAf8wHwYDVR0jBBgwFoAU1fZWy4/oolxiaNE9
// SIG // lJBb186aGMQwVgYDVR0fBE8wTTBLoEmgR4ZFaHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvTWljUm9vQ2VyQXV0XzIwMTAtMDYtMjMuY3JsMFoG
// SIG // CCsGAQUFBwEBBE4wTDBKBggrBgEFBQcwAoY+aHR0cDov
// SIG // L3d3dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNS
// SIG // b29DZXJBdXRfMjAxMC0wNi0yMy5jcnQwDQYJKoZIhvcN
// SIG // AQELBQADggIBAJ1VffwqreEsH2cBMSRb4Z5yS/ypb+pc
// SIG // FLY+TkdkeLEGk5c9MTO1OdfCcTY/2mRsfNB1OW27DzHk
// SIG // wo/7bNGhlBgi7ulmZzpTTd2YurYeeNg2LpypglYAA7AF
// SIG // vonoaeC6Ce5732pvvinLbtg/SHUB2RjebYIM9W0jVOR4
// SIG // U3UkV7ndn/OOPcbzaN9l9qRWqveVtihVJ9AkvUCgvxm2
// SIG // EhIRXT0n4ECWOKz3+SmJw7wXsFSFQrP8DJ6LGYnn8Atq
// SIG // gcKBGUIZUnWKNsIdw2FzLixre24/LAl4FOmRsqlb30mj
// SIG // dAy87JGA0j3mSj5mO0+7hvoyGtmW9I/2kQH2zsZ0/fZM
// SIG // cm8Qq3UwxTSwethQ/gpY3UA8x1RtnWN0SCyxTkctwRQE
// SIG // cb9k+SS+c23Kjgm9swFXSVRk2XPXfx5bRAGOWhmRaw2f
// SIG // pCjcZxkoJLo4S5pu+yFUa2pFEUep8beuyOiJXk+d0tBM
// SIG // drVXVAmxaQFEfnyhYWxz/gq77EFmPWn9y8FBSX5+k77L
// SIG // +DvktxW/tM4+pTFRhLy/AsGConsXHRWJjXD+57XQKBqJ
// SIG // C4822rpM+Zv/Cuk0+CQ1ZyvgDbjmjJnW4SLq8CdCPSWU
// SIG // 5nR0W2rRnj7tfqAxM328y+l7vzhwRNGQ8cirOoo6CGJ/
// SIG // 2XBjU02N7oJtpQUQwXEGahC0HVUzWLOhcGbyoYIDUDCC
// SIG // AjgCAQEwgfmhgdGkgc4wgcsxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJTAjBgNVBAsTHE1pY3Jvc29mdCBBbWVyaWNhIE9w
// SIG // ZXJhdGlvbnMxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVT
// SIG // Tjo4NjAzLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsO
// SIG // AwIaAxUA071VP2I/ZVEsngwmoidg2uYVIkuggYMwgYCk
// SIG // fjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1N
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDANBgkq
// SIG // hkiG9w0BAQsFAAIFAOuWsoswIhgPMjAyNTA0MDExODQ0
// SIG // MjdaGA8yMDI1MDQwMjE4NDQyN1owdzA9BgorBgEEAYRZ
// SIG // CgQBMS8wLTAKAgUA65ayiwIBADAKAgEAAgIdwQIB/zAH
// SIG // AgEAAgITQTAKAgUA65gECwIBADA2BgorBgEEAYRZCgQC
// SIG // MSgwJjAMBgorBgEEAYRZCgMCoAowCAIBAAIDB6EgoQow
// SIG // CAIBAAIDAYagMA0GCSqGSIb3DQEBCwUAA4IBAQBQhdrk
// SIG // YXIKyK5Bh4WZHA03ciuAf1j/8j6bgyQ0jpRMvZT5ZeTB
// SIG // 1ReV/Twx+/tJCxz7xtl+rMyN8+YmkPoHwpHrwy1uFMIn
// SIG // UwRhiM2Tb7HxkSG/XQxViVuQg/y2E9Wki8SGxwT5reKA
// SIG // SE3sGIkX+G93RfHC4gNdSEXAg+1ov3H9aGYyymc077I+
// SIG // ZjRMuqQDRjGoJppYPgyb6Jqe4lV0w72jmoFyfFy4t39f
// SIG // lb/STJL8r8Cx5HFsBO0WYJ76hYa/gmO04yfVUmSF4yxx
// SIG // kCCSdUdF/FVuOKOrc/AlulFXJpfazvZlp3v8vk0I0XP/
// SIG // AlnrDWqjSD9xb5VUPrm+CtdlkOWqMYIEDTCCBAkCAQEw
// SIG // gZMwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMA
// SIG // AAIHLBE5ic2F+8UAAQAAAgcwDQYJYIZIAWUDBAIBBQCg
// SIG // ggFKMBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAv
// SIG // BgkqhkiG9w0BCQQxIgQggZj3w2oOLTB4P8lqsosG7MeG
// SIG // QauUB9raLPhOyw8PEWcwgfoGCyqGSIb3DQEJEAIvMYHq
// SIG // MIHnMIHkMIG9BCAv99TR0HbNSGebD57+fafr+gYwQ4KA
// SIG // zyMIgJp9Dx6nszCBmDCBgKR+MHwxCzAJBgNVBAYTAlVT
// SIG // MRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdS
// SIG // ZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9y
// SIG // YXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0
// SIG // YW1wIFBDQSAyMDEwAhMzAAACBywROYnNhfvFAAEAAAIH
// SIG // MCIEIDs7QEgaKC8eNJiasBMIZ++y42qRGX/MGWpE8sny
// SIG // UhJRMA0GCSqGSIb3DQEBCwUABIICAI2trEwuTQtbHHkL
// SIG // wtfA/0/qg0nx1FtwPS+0/34KmpTC4CN3LWwhQ8djKRMD
// SIG // zrF9+Rw4F3yr5DeuTjtTY38RsOV9/Mjxf3ooNSsv2pcf
// SIG // 1iQI66NDoQci2SG0XNiNDUTY9A34BzFWgMwBI/aPjRiX
// SIG // ny6aLC7CGGYB9oFKBswM46EGEbN+aahVAamAAz9If+GG
// SIG // vDAfQOP8Pqi5rCHSHX/IipZ6rmIrcnfzcHi1zabNK4+0
// SIG // 2z58P7XScKl0TFouI5/trh8cAK4NJFUBu+kYDnDkD27h
// SIG // u/J0wn2kaPR/XuzLur8C+6P5jL5VU0DVUm3Qh62uUefL
// SIG // 6Sj6veAcHr43Aszd0FL6uzDfMF4Ss0N1aXwZCP8euQZl
// SIG // 8dil1uLAx7o87gArz8ZjW7UTl3nbZCqeGUlTruZlFCJ+
// SIG // Y2OMj8Eo1lixb1DaGtmg5Ou0ZrnInEsF3VjbsNuf3Y2O
// SIG // Dtpouv58w0DAap7jhsf3IvowELWg2wNImzqAGogJECjN
// SIG // cWG+m55AVliBXqppViHynqxMUE+nYkG3BFIo6Y3h41dX
// SIG // PStjiZIAL7fRhhfeh3L3jJ5wPfe1WIIxzL+cW/TUdi85
// SIG // n84Ti9XndGnL23y3GgC+967dVmF/Q66TOb2/B3rK0dfQ
// SIG // 7T9rUziuLFpnZS25UzkNDNZjZU4NPW3ai7IEd308WFo6
// SIG // XKDSFSa5
// SIG // End signature block
