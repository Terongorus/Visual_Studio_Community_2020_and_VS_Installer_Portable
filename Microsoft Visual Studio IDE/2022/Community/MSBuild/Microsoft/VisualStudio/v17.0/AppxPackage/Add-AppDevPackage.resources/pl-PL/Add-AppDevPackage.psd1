# Localized	07/10/2025 10:41 PM (GMT)	303:7.1.41104 	Add-AppDevPackage.psd1
# Culture = "en-US"
ConvertFrom-StringData @'
###PSLOC
PromptYesString=&Tak
PromptNoString=&Nie
BundleFound=Znaleziono pakiet: {0}
PackageFound=Znaleziono pakiet: {0}
EncryptedBundleFound=Znaleziono zaszyfrowany zbiór: {0}
EncryptedPackageFound=Znaleziono zaszyfrowany pakiet: {0}
CertificateFound=Znaleziono certyfikat: {0}
DependenciesFound=Znaleziono pakiety zależności:
GettingDeveloperLicense=Trwa uzyskiwanie licencji dewelopera...
InstallingCertificate=Trwa instalowanie certyfikatu...
InstallingPackage=\nTrwa instalowanie aplikacji...
AcquireLicenseSuccessful=Pomyślnie uzyskano licencję dewelopera.
InstallCertificateSuccessful=Pomyślnie zainstalowano certyfikat.
Success=\nPowodzenie: pomyślnie zainstalowano aplikację.
WarningInstallCert=\nZamierzasz zainstalować certyfikat cyfrowy w magazynie zaufanych osób na komputerze. Stanowi to poważne zagrożenie bezpieczeństwa. Należy to robić tylko w sytuacji, gdy ufasz nadawcy certyfikatu cyfrowego.\n\nPo zakończeniu korzystania z aplikacji usuń ręcznie skojarzony certyfikat cyfrowy. Odpowiednie instrukcje są dostępne pod tym adresem: http://go.microsoft.com/fwlink/?LinkId=243053\n\nCzy na pewno chcesz kontynuować?\n\n
ElevateActions=\nPrzed zainstalowaniem tej aplikacji musisz wykonać następujące czynności:
ElevateActionDevLicense=\t- Uzyskaj licencję dewelopera
ElevateActionCertificate=\t- Zainstaluj certyfikat podpisywania
ElevateActionsContinue=Aby móc kontynuować, musisz podać poświadczenia administratora. Zaakceptuj monit kontroli konta użytkownika i podaj hasło administratora, gdy zostanie wyświetlony odpowiedni monit.
ErrorForceElevate=Aby móc kontynuować, musisz podać poświadczenia administratora. Uruchom ten skrypt bez parametru -Force lub w oknie programu PowerShell z podniesionym poziomem uprawnień.
ErrorForceDeveloperLicense=Uzyskanie licencji dewelopera wymaga interakcji użytkownika. Uruchom ponownie skrypt bez parametru -Force.
ErrorLaunchAdminFailed=Błąd: nie można uruchomić nowego procesu jako administrator.
ErrorNoScriptPath=Błąd: musisz uruchomić ten skrypt z pliku.
ErrorNoPackageFound=Błąd: nie znaleziono pakietu w katalogu skryptu. Upewnij się, że w tym samym katalogu co skrypt znajduje się pakiet, który chcesz zainstalować.
ErrorManyPackagesFound=Błąd: znaleziono więcej niż jeden pakiet w katalogu skryptu. Upewnij się, że w tym samym katalogu co skrypt znajduje się tylko pakiet, który chcesz zainstalować.
ErrorPackageUnsigned=Błąd: pakiet nie ma podpisu cyfrowego lub jego podpis jest uszkodzony.
ErrorNoCertificateFound=Błąd: nie znaleziono certyfikatu w katalogu skryptu. Upewnij się, że w tym samym katalogu co skrypt znajduje się certyfikat używany do podpisywania instalowanego pakietu.
ErrorManyCertificatesFound=Błąd: znaleziono więcej niż jeden certyfikat w katalogu skryptu. Upewnij się, że w tym samym katalogu co skrypt znajduje się tylko certyfikat używany do podpisywania instalowanego pakietu.
ErrorBadCertificate=Błąd: plik „{0}” nie jest prawidłowym certyfikatem cyfrowym. Program CertUtil zwrócił kod błędu {1}.
ErrorExpiredCertificate=Błąd: certyfikat dewelopera „{0}” wygasł. Jedną z możliwych przyczyn jest niepoprawna data i godzina zegara systemowego. Jeśli ustawienia systemu są poprawne, skontaktuj się z właścicielem aplikacji w celu ponownego utworzenia pakietu przy użyciu prawidłowego certyfikatu.
ErrorCertificateMismatch=Błąd: certyfikat nie jest zgodny z certyfikatem, za pomocą którego podpisano pakiet.
ErrorCertIsCA=Błąd: certyfikat nie może być urzędem certyfikacji.
ErrorBannedKeyUsage=Błąd: certyfikat nie może mieć następującego rozszerzonego użycia klucza: {0}. Użycie klucza musi być nieokreślone lub mieć wartość „DigitalSignature”.
ErrorBannedEKU=Błąd: certyfikat nie może mieć następującego rozszerzonego użycia klucza: {0}. Dozwolone są tylko rozszerzone użycia klucza podpisywania kodu i okresu istnienia.
ErrorNoBasicConstraints=Błąd: certyfikat nie ma podstawowego rozszerzenia ograniczeń.
ErrorNoCodeSigningEku=Błąd: certyfikat nie ma rozszerzonego klucza użycia na potrzeby podpisywania kodu.
ErrorInstallCertificateCancelled=Błąd: anulowano instalację certyfikatu.
ErrorCertUtilInstallFailed=Błąd: nie można zainstalować certyfikatu. Program CertUtil zwrócił kod błędu {0}.
ErrorGetDeveloperLicenseFailed=Błąd: nie można uzyskać licencji dewelopera. Aby uzyskać więcej informacji, zobacz http://go.microsoft.com/fwlink/?LinkID=252740.
ErrorInstallCertificateFailed=Błąd: nie można zainstalować certyfikatu. Stan: {0}. Aby uzyskać więcej informacji, zobacz http://go.microsoft.com/fwlink/?LinkID=252740.
ErrorAddPackageFailed=Błąd: nie można zainstalować aplikacji.
ErrorAddPackageFailedWithCert=Błąd: nie można zainstalować aplikacji. Aby zapewnić bezpieczeństwo, rozważ odinstalowanie certyfikatu podpisywania do czasu, gdy zainstalowanie aplikacji będzie możliwe. Odpowiednie instrukcje można znaleźć pod tym adresem:\nhttp://go.microsoft.com/fwlink/?LinkId=243053
'@
