# Localized	07/10/2025 10:41 PM (GMT)	303:7.1.41104 	Add-AppDevPackage.psd1
# Culture = "en-US"
ConvertFrom-StringData @'
###PSLOC
PromptYesString=&Ano
PromptNoString=&Ne
BundleFound=Nalezený svazek: {0}
PackageFound=Nalezený balíček: {0}
EncryptedBundleFound=Nalezena zašifrovaná sada prostředků: {0}
EncryptedPackageFound=Nalezen zašifrovaný balíček: {0}
CertificateFound=Nalezený certifikát: {0}
DependenciesFound=Nalezené balíčky závislostí:
GettingDeveloperLicense=Získává se vývojářská licence...
InstallingCertificate=Instaluje se certifikát...
InstallingPackage=\nInstaluje se aplikace...
AcquireLicenseSuccessful=Vývojářská licence se úspěšně získala.
InstallCertificateSuccessful=Certifikát se úspěšně nainstaloval.
Success=\nÚspěch: Aplikace se úspěšně nainstalovala.
WarningInstallCert=\nChystáte se do úložiště certifikátů od důvěryhodných osob ve vašem počítači nainstalovat digitální certifikát. Provedení této akce představuje vážné bezpečnostní riziko a měli byste ji provést jenom v případě, že původci tohoto digitálního certifikátu důvěřujete.\n\nAž tuto aplikaci přestanete používat, měli byste přidružený digitální certifikát ručně odebrat. Postup, jak to udělat, najdete tady: http://go.microsoft.com/fwlink/?LinkId=243053\n\nOpravdu chcete pokračovat?\n\n
ElevateActions=\nPřed instalací této aplikace musíte provést následující:
ElevateActionDevLicense=\t- získat vývojářskou licenci
ElevateActionCertificate=\t- nainstalovat podpisový certifikát
ElevateActionsContinue=Po zadání přihlašovacích údajů správce budete moct pokračovat. Přijměte prosím výzvu služby UAC a v případě, že budete vyzváni, zadejte heslo správce.
ErrorForceElevate=Po zadání přihlašovacích údajů správce budete moct pokračovat. Spusťte prosím tento skript bez parametru -Force, nebo z okna prostředí PowerShell se zvýšenými oprávněními.
ErrorForceDeveloperLicense=Získání vývojářské licence vyžaduje interakci s uživatelem. Spusťte prosím tento skript znovu bez parametru -Force.
ErrorLaunchAdminFailed=Chyba: Nový proces nemůžete zahájit jako správce.
ErrorNoScriptPath=Chyba: Tento skript je potřeba spustit ze souboru.
ErrorNoPackageFound=Chyba: V adresáři skriptů se nenašel žádný balíček ani svazek. Zkontrolujte prosím, jestli se balíček nebo svazek, který chcete nainstalovat, nachází ve stejném adresáři jako tento skript.
ErrorManyPackagesFound=Chyba: V adresáři skriptů se našlo víc balíčků nebo svazků. Zkontrolujte prosím, že se ve stejném adresáři jako skript nachází jenom ten balíček nebo svazek, který chcete nainstalovat.
ErrorPackageUnsigned=Chyba: Balíček nebo svazek není digitálně podepsaný nebo je jeho podpis poškozený.
ErrorNoCertificateFound=Chyba: V adresáři skriptů se nenašel žádný certifikát. Zkontrolujte prosím, že se certifikát použitý k podpisu balíčku nebo svazku, který chcete nainstalovat, nachází ve stejném adresáři jako tento skript.
ErrorManyCertificatesFound=Chyba: V adresáři skriptů se našlo víc certifikátů. Zkontrolujte prosím, že se ve stejném adresáři jako tento skript nachází jenom ten certifikát použitý k podpisu balíčku nebo svazku, který chcete nainstalovat.
ErrorBadCertificate=Chyba: Soubor {0} není platným digitálním certifikátem. Nástroj CertUtil se vrátil s kódem chyby {1}.
ErrorExpiredCertificate=Chyba: Platnost certifikátu vývojáře {0} vypršela. Jednou z možných příčin je skutečnost, že systémové hodiny nejsou nastavené na správné datum a čas. Pokud je nastavení systému správné, obraťte se na vlastníka aplikace s žádostí o opakované vytvoření balíčku nebo svazku s platným certifikátem.
ErrorCertificateMismatch=Chyba: Certifikát se neshoduje s tím, který je použitý k podpisu balíčku nebo svazku.
ErrorCertIsCA=Chyba: Jako certifikát se nedá použít certifikační autorita.
ErrorBannedKeyUsage=Chyba: Certifikát nemůže mít následující použití klíče: {0}. Použití klíče musí být neurčené nebo shodné s digitálním podpisem.
ErrorBannedEKU=Chyba: Certifikát nemůže mít následující rozšířené použití klíče: {0}. Povolené je jenom rozšířené použití klíče podpisu kódu a životnosti podepisování.
ErrorNoBasicConstraints=Chyba: U certifikátu chybí rozšíření základních omezení.
ErrorNoCodeSigningEku=Chyba: U certifikátu chybí rozšířené použití klíče pro podpis kódu.
ErrorInstallCertificateCancelled=Chyba: Instalace certifikátu byla zrušena.
ErrorCertUtilInstallFailed=Chyba: Certifikát se nepovedlo nainstalovat. Nástroj CertUtil se vrátil s kódem chyby {0}.
ErrorGetDeveloperLicenseFailed=Chyba: Nepovedlo se získat vývojářskou licenci. Další informace najdete na adrese http://go.microsoft.com/fwlink/?LinkID=252740.
ErrorInstallCertificateFailed=Chyba: Certifikát se nepovedlo nainstalovat. Stav: {0}. Další informace najdete na adrese http://go.microsoft.com/fwlink/?LinkID=252740.
ErrorAddPackageFailed=Chyba: Aplikace se nedala nainstalovat.
ErrorAddPackageFailedWithCert=Chyba: Aplikace se nedala nainstalovat. Abyste zajistili bezpečnost, zvažte prosím odinstalování podpisového certifikátu, dokud nebudete moct aplikaci nainstalovat. Postup, jak to udělat, najdete tady:\nhttp://go.microsoft.com/fwlink/?LinkId=243053
'@
