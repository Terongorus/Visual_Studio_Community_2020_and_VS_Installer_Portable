"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = exports.anyWhere = void 0;
const assert_1 = require("assert");
const manual_promise_1 = require("./manual-promise");
/** a precrafted failed Promise */
const waiting = Promise.reject(0xDEFACED);
waiting.catch(() => { });
/**
 * Does a Promise.any(), and accept the one that first matches the predicate, or if all resolve, and none match, the first.
 *
 * @remarks WARNING - this requires Node 15+
 * @param from
 * @param predicate
 */
async function anyWhere(from, predicate) {
    let unfulfilled = new Array();
    const failed = new Array();
    const completed = new Array();
    // wait for something to succeed. if nothing suceeds, then this will throw.
    const first = await Promise.any(from);
    let success;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        //
        for (const each of from) {
            // if we had a winner, return now.
            await Promise.any([each, waiting]).then(antecedent => {
                if (predicate(antecedent)) {
                    success = antecedent;
                    return antecedent;
                }
                completed.push(antecedent);
                return undefined;
            }).catch(r => {
                if (r === 0xDEFACED) {
                    // it's not done yet.
                    unfulfilled.push(each);
                }
                else {
                    // oh, it returned and it was a failure.
                    failed.push(each);
                }
                return undefined;
            });
        }
        // we found one that passes muster!
        if (success) {
            return success;
        }
        if (unfulfilled.length) {
            // something completed successfully, but nothing passed the predicate yet.
            // so hope remains eternal, lets rerun whats left with the unfulfilled.
            from = unfulfilled;
            unfulfilled = [];
            continue;
        }
        // they all finished
        // but nothing hit the happy path.
        break;
    }
    // if we get here, then we're
    // everything completed, but nothing passed the predicate
    // give them the first to suceed
    return first;
}
exports.anyWhere = anyWhere;
class Queue {
    maxConcurency;
    total = 0;
    active = 0;
    queue = new Array();
    whenZero;
    rejections = new Array();
    constructor(maxConcurency = 8) {
        this.maxConcurency = maxConcurency;
    }
    get count() {
        return this.total;
    }
    get done() {
        return this.zero();
    }
    /** Will block until the queue hits the zero mark */
    async zero() {
        if (this.active) {
            this.whenZero = this.whenZero || new manual_promise_1.ManualPromise();
            await this.whenZero;
        }
        if (this.rejections.length > 0) {
            throw new AggregateError(this.rejections);
        }
        this.whenZero = undefined;
        return this.total;
    }
    next() {
        (--this.active) || this.whenZero?.resolve(0);
        if (this.queue.length) {
            this.queue.pop()?.execute().catch(async (e) => { this.rejections.push(e); throw e; }).finally(() => this.next());
        }
    }
    /**
     * Queues up actions for throttling the number of concurrent async tasks running at a given time.
     *
     * If the process has reached max concurrency, the action is deferred until the last item
     * The last item
     * @param action
     */
    async enqueue(action) {
        assert_1.strict.ok(!this.whenZero, 'items may not be added to the queue while it is being awaited');
        this.active++;
        this.total++;
        if (this.queue.length || this.active >= this.maxConcurency) {
            const result = new manual_promise_1.LazyPromise(action);
            this.queue.push(result);
            return result;
        }
        return action().catch(async (e) => { this.rejections.push(e); throw e; }).finally(() => this.next());
    }
    enqueueMany(iterable, fn) {
        for (const each of iterable) {
            void this.enqueue(() => fn(each));
        }
        return this;
    }
}
exports.Queue = Queue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvbWlzZS5qcyIsInNvdXJjZVJvb3QiOiJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbWljcm9zb2Z0L3ZjcGtnLXRvb2wvbWFpbi92Y3BrZy1hcnRpZmFjdHMvIiwic291cmNlcyI6WyJ1dGlsL3Byb21pc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHVDQUF1QztBQUN2QyxrQ0FBa0M7OztBQUVsQyxtQ0FBZ0M7QUFDaEMscURBQThEO0FBRTlELGtDQUFrQztBQUNsQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQVUsQ0FBQyxDQUFDLENBQUM7QUFFaEM7Ozs7OztHQU1HO0FBQ0ksS0FBSyxVQUFVLFFBQVEsQ0FBSSxJQUEwQixFQUFFLFNBQWdDO0lBQzVGLElBQUksV0FBVyxHQUFHLElBQUksS0FBSyxFQUFjLENBQUM7SUFDMUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxLQUFLLEVBQWMsQ0FBQztJQUN2QyxNQUFNLFNBQVMsR0FBRyxJQUFJLEtBQUssRUFBSyxDQUFDO0lBRWpDLDJFQUEyRTtJQUMzRSxNQUFNLEtBQUssR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEMsSUFBSSxPQUFzQixDQUFDO0lBRTNCLGlEQUFpRDtJQUNqRCxPQUFPLElBQUksRUFBRTtRQUVYLEVBQUU7UUFDRixLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksRUFBRTtZQUN2QixrQ0FBa0M7WUFDbEMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO2dCQUNuRCxJQUFJLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDekIsT0FBTyxHQUFHLFVBQVUsQ0FBQztvQkFDckIsT0FBTyxVQUFVLENB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
// SIG // Begin signature block
// SIG // MIIoUAYJKoZIhvcNAQcCoIIoQTCCKD0CAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // DZKTH64G8xrmPdnafVhbD6suoujtumZPYrFhgWPEUh2g
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
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCClXaM9XbbRn1C3
// SIG // +iCDyFxWxK6JQDUXaR47qJf2tUo9dDBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBABedu72TqaKrzSRBGFS9C9C1GfbshxVN
// SIG // +Em//778hgVve2Lj4l1mlZxlsU26gwd5B4my0BKp/wPw
// SIG // MWJc5ijoXT2NGuAgPzjLPU9my68PfUPmkf2ZgDQ+DbNF
// SIG // tTc+PdmkjxGTrDntKeYKlG6f15dNngP+QcnHe+OmGDrv
// SIG // PgrPNU1TFo04AS9SCvDw1eZhOWODYslqChCfem5JDQ0u
// SIG // VlVQ15j5ayCZFMeaVcanxazOpc0K5zYbuSz/ZZDQugM2
// SIG // LmqJmt5vvUtF9g24EGj9NFpIqbuyZEAHPyS1BPC/p+zp
// SIG // //glZvX9Db9whMrO4MJ+dO4aBdudnTn5Dl5vaf4+OQu5
// SIG // xTmhghetMIIXqQYKKwYBBAGCNwMDATGCF5kwgheVBgkq
// SIG // hkiG9w0BBwKggheGMIIXggIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBWgYLKoZIhvcNAQkQAQSgggFJBIIBRTCCAUEC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // llQZ1maYGvtYapJBWbwSN1EU4DhdSufEIhakU/zDY3sC
// SIG // Bme/t/w1YxgTMjAyNTA0MDExOTU5MzIuMTAyWjAEgAIB
// SIG // 9KCB2aSB1jCB0zELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEtMCsG
// SIG // A1UECxMkTWljcm9zb2Z0IElyZWxhbmQgT3BlcmF0aW9u
// SIG // cyBMaW1pdGVkMScwJQYDVQQLEx5uU2hpZWxkIFRTUyBF
// SIG // U046NTUxQS0wNUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jv
// SIG // c29mdCBUaW1lLVN0YW1wIFNlcnZpY2WgghH7MIIHKDCC
// SIG // BRCgAwIBAgITMwAAAgHRRVmYEMxCTwABAAACATANBgkq
// SIG // hkiG9w0BAQsFADB8MQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYw
// SIG // JAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0Eg
// SIG // MjAxMDAeFw0yNDA3MjUxODMxMjJaFw0yNTEwMjIxODMx
// SIG // MjJaMIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQL
// SIG // EyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExp
// SIG // bWl0ZWQxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVTTjo1
// SIG // NTFBLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9zb2Z0
// SIG // IFRpbWUtU3RhbXAgU2VydmljZTCCAiIwDQYJKoZIhvcN
// SIG // AQEBBQADggIPADCCAgoCggIBALVq3/h8w7u7JOdMuWB4
// SIG // XgiCRtLsUUhRXBzXpPk3fWZsiY9tBBI2lPCQybuaVnOK
// SIG // TwLASN/DRACdW/igZ5UralPLr1xeKpxEoQ3YvJz7GWUL
// SIG // E2QylgIFDNomUzoliLmXBbOWQvP/hpa1SzOYdWPZ3zIe
// SIG // QeA51EDlzK3pgE/TJL1IYN7mmIJqi5ZmMjg5m2uJV2Qb
// SIG // tdOEiwBbFzn5f0y4aU6E+Osu5SPbGyPbqt/wHq4d2j4t
// SIG // pJx7xBGs4pV3qKFzSwsHbviLOqPJEC6LlJ9ysFEJtG+2
// SIG // lLbL9V/zoD5rDiYusjdy2FshyEr6zbiKyeImDYB3QQbp
// SIG // kGCvC42ZkGkyhWnMYZlydKtoM2iH8RdsiMDPlfbEKpB5
// SIG // IP0PokgzaTK+pq/zsJJzhCIyNIOmTDspor6QocwzaD8/
// SIG // YZCt4FR2SluzVfPlAVzeBtGgV+vXylG8QQS8pNnAvj4T
// SIG // qFI5JelAvP3NIbqo+cV/JvmFSJPNXu7eiPlfxOMl0Xnm
// SIG // YK9BYWKjab04xnGjtlq5D+V5rGEuyLzDyH+AwsiCVGWq
// SIG // qATE6ACSRxkXvgz6gh4Om5hj5vezKzlr9evwqOkvXEA5
// SIG // F6fbzEkkUFl8uCrSYWX5rg89r69Y8ODXoscLiAxsNZrV
// SIG // f03UiPr6SyX1Ii5f2/cP7SQfdgQC0E/HtWB/DaYXTqNc
// SIG // QsJHAgMBAAGjggFJMIIBRTAdBgNVHQ4EFgQUsHKvW5ai
// SIG // 6Dz4la8pvZhZhVm8slIwHwYDVR0jBBgwFoAUn6cVXQBe
// SIG // Yl2D9OXSZacbUzUZ6XIwXwYDVR0fBFgwVjBUoFKgUIZO
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9j
// SIG // cmwvTWljcm9zb2Z0JTIwVGltZS1TdGFtcCUyMFBDQSUy
// SIG // MDIwMTAoMSkuY3JsMGwGCCsGAQUFBwEBBGAwXjBcBggr
// SIG // BgEFBQcwAoZQaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jZXJ0cy9NaWNyb3NvZnQlMjBUaW1lLVN0
// SIG // YW1wJTIwUENBJTIwMjAxMCgxKS5jcnQwDAYDVR0TAQH/
// SIG // BAIwADAWBgNVHSUBAf8EDDAKBggrBgEFBQcDCDAOBgNV
// SIG // HQ8BAf8EBAMCB4AwDQYJKoZIhvcNAQELBQADggIBADo0
// SIG // AMs9HFc7UxRql1+SS0cRSvzv6DHuebg6hAvFXdYG3DNv
// SIG // CgVD4L1CD15v73QzdiFQZFh5sAqeACHMuHWbZLlJndH5
// SIG // 7umk/TL6NZ3bC6dmCXDKBSxLd07a4i2jvouBq79GVC7V
// SIG // l1DwFvzJ+UnI4J9MWXbhjwQ/17Nye/oHrffvGbwYqbIP
// SIG // ze6aIpmDlbB8S3Hpu1eV3TDbMrU5v7gqJoTP8IEeSpQ2
// SIG // E1TQFwcXEijHiWog91dfh4TZFZYjJeVTj/p8OcVheebv
// SIG // Yenhdhu3gT6k/qkhUPq0AkHSKzdMhtUDfTya6ILivhSU
// SIG // CXUM3Xw90VlbHIgcoG2GmZU9XBiSNSMkO+A0NFAXU6X3
// SIG // hrMqxEPTyPEMqlS6m9quy7SOgyTDaYWLvo6//9LKa9VF
// SIG // b8gz7bkZ2xkETYtQjsCXI/TmJpZBYCjXgn2w0+1N7hDr
// SIG // 1qJnpF+tGP5ubrUXFD1XgD3YZAfg8Q2nr9ydcsAzXcrv
// SIG // ddZwFT4EZMioDCt1Eixt+xHZWrQ5PBcrgq8eLYh8qhzt
// SIG // 8BOsT8N9kPHv75rkD6AWbl96lHqBSLMmRHpx6tknDLp4
// SIG // XKlt9klFQIuaGeGd53+3QIDWrttTRD8IFvtsJKzag4Ox
// SIG // 6fMh8qDim4BAbukREG70n2eSoeD1fktoMX9rquhqGA55
// SIG // agATjGMM99PSEotGzzIfMIIHcTCCBVmgAwIBAgITMwAA
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
// SIG // MScwJQYDVQQLEx5uU2hpZWxkIFRTUyBFU046NTUxQS0w
// SIG // NUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1l
// SIG // LVN0YW1wIFNlcnZpY2WiIwoBATAHBgUrDgMCGgMVANft
// SIG // unEf8h9dNA4jRRlobgL9q2AaoIGDMIGApH4wfDELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0
// SIG // IFRpbWUtU3RhbXAgUENBIDIwMTAwDQYJKoZIhvcNAQEL
// SIG // BQACBQDrll4PMCIYDzIwMjUwNDAxMTI0MzU5WhgPMjAy
// SIG // NTA0MDIxMjQzNTlaMHQwOgYKKwYBBAGEWQoEATEsMCow
// SIG // CgIFAOuWXg8CAQAwBwIBAAICF8wwBwIBAAICEvAwCgIF
// SIG // AOuXr48CAQAwNgYKKwYBBAGEWQoEAjEoMCYwDAYKKwYB
// SIG // BAGEWQoDAqAKMAgCAQACAwehIKEKMAgCAQACAwGGoDAN
// SIG // BgkqhkiG9w0BAQsFAAOCAQEAd+WJxVxhAx1vMVfFFjlt
// SIG // Eio6hZj8HxgGoemOF7dcpqUWLVrUdon51Knqm75FxH5U
// SIG // kNgr9nj2RMBV3sO/Qv4bTIfYp9+HabN0xTV8XQVOmkle
// SIG // TZi2Hl+eGNfwy1eqoTGo2gjNXgFfjZwvd/mgUeW228/+
// SIG // WgSRLwocb3wSQzyLW/7ZzOCg/sRR1W26WsFHeSMVHYzR
// SIG // W1yj4L0HvHKRl+s1G2UVLyvOUHnT9ZBvqltGd3Hdzfuf
// SIG // uI7q86fbBa3sgRSdYod0cf50D8+OsDyqvleSfpfHh840
// SIG // wbDufpS9WvtVZi2b7VSs1PVFxZWo5PeyGTujVTGLj/Ny
// SIG // c2owSdiQIW1w4jGCBA0wggQJAgEBMIGTMHwxCzAJBgNV
// SIG // BAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYD
// SIG // VQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQg
// SIG // Q29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBU
// SIG // aW1lLVN0YW1wIFBDQSAyMDEwAhMzAAACAdFFWZgQzEJP
// SIG // AAEAAAIBMA0GCWCGSAFlAwQCAQUAoIIBSjAaBgkqhkiG
// SIG // 9w0BCQMxDQYLKoZIhvcNAQkQAQQwLwYJKoZIhvcNAQkE
// SIG // MSIEIMcXcMHVV+2RZev7+cEhThrAZjuSiu6QcTNcOS9y
// SIG // hHbdMIH6BgsqhkiG9w0BCRACLzGB6jCB5zCB5DCBvQQg
// SIG // WGuyOkyUEXJsdB2kk1mXSYKMHa5ffma69KSHah7XOCMw
// SIG // gZgwgYCkfjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMK
// SIG // V2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwG
// SIG // A1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYD
// SIG // VQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAx
// SIG // MAITMwAAAgHRRVmYEMxCTwABAAACATAiBCCYlRR5odU0
// SIG // tEa1GHIZq5OaEmB/A9fi2nEg8vJtVlavEzANBgkqhkiG
// SIG // 9w0BAQsFAASCAgB8/kzc2LZtlzindRITI/Z4/NQEV7IY
// SIG // sIAZNnMJLQQ2Eb9dq50TQdW2QvR6HNGergRA2WBjV4Uh
// SIG // zBG2OgPJiOocz2RYZyBg4LmKVoZHahdMScNrpTQNMumc
// SIG // 0DvxLiEh2nYDFXt8oWL2g+R3OaA7a/s/cYvpmZlWuZAi
// SIG // iMYC0wCULHjFVsodQFQVla1jVvjuOsfaz4rEV54GbyRZ
// SIG // rYjzoGQEVmE89L7DbuON0REXPK9pdznbvCmv3kEDgYyB
// SIG // 79A1fkGq1b7yGH/evsJ1ieaF56nYIrhKzNXygZxum+i3
// SIG // rztH33E9ZmxZf+vKujreAa0DcBYBWbhzq+qLP0Dtm0k+
// SIG // /opLDtHL0RvlJgv6sPnphhTxF2yxfCOLKFA2kjnklivi
// SIG // lVsHidSZDz65XANjmgXg6dQsuAHNichQLv7+CNnRCJE9
// SIG // euaIJyoilguaTHW/uIfqOhxEu3wN/0bQ/IEHTSupzGtr
// SIG // abyAsnjKzDWGk567/cS72tmaVKD2vahTsiIO1Bg+yxWP
// SIG // 8hK3JwxstLXHWTXFR34CId9GBF4tlqaR6W+DqCShmV4i
// SIG // 6iROhSDZfUWHW+goLOiG2XcP4H9YODIr28wpDnQfZcKz
// SIG // Ar4TT1d4BYDr/WjIQ55vmE5UmakxrvepblmDpO/vauIV
// SIG // rcMgZBXcwA0GCdofZoAX3AsKn+5LnEeMOHgHtQ==
// SIG // End signature block
