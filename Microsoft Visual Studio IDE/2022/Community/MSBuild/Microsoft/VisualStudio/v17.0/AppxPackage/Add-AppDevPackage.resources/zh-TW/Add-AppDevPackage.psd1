# Localized	07/10/2025 10:41 PM (GMT)	303:7.1.41104 	Add-AppDevPackage.psd1
# Culture = "en-US"
ConvertFrom-StringData @'
###PSLOC
PromptYesString=是(&Y)
PromptNoString=否(&N)
BundleFound=找到下列資源存放區: {0}
PackageFound=找到封裝: {0}
EncryptedBundleFound=找到加密的套件組合: {0}
EncryptedPackageFound=找到加密的套件: {0}
CertificateFound=找到憑證: {0}
DependenciesFound=找到相依性封裝: 
GettingDeveloperLicense=正在取得開發人員授權...
InstallingCertificate=正在安裝憑證...
InstallingPackage=\n正在安裝應用程式...
AcquireLicenseSuccessful=已成功取得開發人員授權。
InstallCertificateSuccessful=已成功安裝憑證。
Success=\n成功: 已成功安裝您的應用程式。
WarningInstallCert=\n您即將安裝數位憑證到您電腦的「受信任的人」憑證存放區。這會帶來嚴重的安全性風險，請務必在您信任這個數位憑證的建立者的情況下才執行這個動作。\n\n使用完這個應用程式之後，您應該手動移除相關的數位憑證。有關執行這個動作的指示，請參閱: http://go.microsoft.com/fwlink/?LinkId=243053\n\n您確定要繼續嗎?\n\n
ElevateActions=\n安裝這個應用程式之前，必須執行下列動作: 
ElevateActionDevLicense=\t- 取得開發人員授權
ElevateActionCertificate=\t- 安裝簽署憑證
ElevateActionsContinue=必須有系統管理員認證才能繼續。請接受 UAC 提示，並在系統要求時提供您的系統管理員密碼。
ErrorForceElevate=您必須提供系統管理員認證才能繼續。請在不含 -Force 參數的情況下執行這個指令碼，或從更高權限的 PowerShell 視窗執行。
ErrorForceDeveloperLicense=必須透過使用者互動才能取得開發人員授權。請在不含 -Force 參數的情況下執行指令碼。
ErrorLaunchAdminFailed=錯誤: 無法以系統管理員身分啟動新處理序。
ErrorNoScriptPath=錯誤: 您必須從檔案啟動這個指令碼。
ErrorNoPackageFound=錯誤:  在指令碼目錄中找不到任何封裝或資源存放區。請確定您要安裝的封裝或資源存放區是放在與這個指令碼相同的目錄中。
ErrorManyPackagesFound=錯誤:  在指令碼目錄中找到多個封裝或資源存放區。請確定您只將要安裝的封裝或資源存放區放在與這個指令碼相同的目錄中。
ErrorPackageUnsigned=錯誤: 封裝或資源存放區未經數位簽署，或其簽章已損毀。
ErrorNoCertificateFound=錯誤:  在指令碼目錄中找不到任何憑證。請確定用來簽署要安裝之封裝或資源存放區的憑證是放在與這個指令碼相同的目錄中。
ErrorManyCertificatesFound=錯誤:  在指令碼目錄中找到多個憑證。請確定您只將用來簽署要安裝之封裝或資源存放區的憑證放在與這個指令碼相同的目錄中。
ErrorBadCertificate=錯誤:  檔案 "{0}" 不是有效的數位憑證。CertUtil 傳回錯誤碼 {1}。
ErrorExpiredCertificate=錯誤: 開發人員憑證 "{0}" 已過期。一個可能的原因是系統時鐘未設為正確的日期和時間。如果系統設定正確，請連絡應用程式擁有者，用有效的憑證重新建立封裝或資源存放區。
ErrorCertificateMismatch=錯誤: 這個憑證與用來簽署封裝或資源存放區的憑證不符。
ErrorCertIsCA=錯誤: 憑證不可以是憑證授權單位。
ErrorBannedKeyUsage=錯誤:  憑證不可以有下列金鑰使用方法:  {0}。金鑰使用方法必須是未指定或等於 "DigitalSignature"。
ErrorBannedEKU=錯誤:  憑證不可以有下列擴充金鑰使用方法:  {0}。只允許「程式碼簽署」和「永久簽署」EKU。
ErrorNoBasicConstraints=錯誤: 憑證遺漏基本限制延伸。
ErrorNoCodeSigningEku=錯誤: 憑證遺漏程式碼簽署的擴充金鑰使用方法。
ErrorInstallCertificateCancelled=錯誤: 已取消安裝憑證。
ErrorCertUtilInstallFailed=錯誤:  無法安裝憑證。CertUtil 傳回錯誤碼 {0}。
ErrorGetDeveloperLicenseFailed=錯誤: 無法取得開發人員授權。如需詳細資訊，請參閱 http://go.microsoft.com/fwlink/?LinkID=252740。
ErrorInstallCertificateFailed=錯誤: 無法安裝憑證。狀態: {0}。如需詳細資訊，請參閱 http://go.microsoft.com/fwlink/?LinkID=252740。
ErrorAddPackageFailed=錯誤: 無法安裝應用程式。
ErrorAddPackageFailedWithCert=錯誤: 無法安裝應用程式。為了確保安全性，請考慮解除安裝簽署憑證，直到您可以安裝應用程式為止。如需執行此動作的指示，請參閱:\nhttp://go.microsoft.com/fwlink/?LinkId=243053
'@
