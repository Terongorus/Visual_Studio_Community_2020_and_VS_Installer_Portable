# Localized	07/10/2025 10:41 PM (GMT)	303:7.1.41104 	Add-AppDevPackage.psd1
# Culture = "en-US"
ConvertFrom-StringData @'
###PSLOC
PromptYesString=&Ja
PromptNoString=&Nein
BundleFound=Bundle gefunden: {0}
PackageFound=Paket gefunden: {0}
EncryptedBundleFound=Verschlüsseltes Bundle gefunden: {0}
EncryptedPackageFound=Verschlüsseltes Paket gefunden: {0}
CertificateFound=Zertifikat gefunden: {0}
DependenciesFound=Abhängigkeitspaket(e) gefunden:
GettingDeveloperLicense=Entwicklerlizenz wird abgerufen...
InstallingCertificate=Zertifikat wird installiert...
InstallingPackage=\nApp wird installiert...
AcquireLicenseSuccessful=Entwicklerlizenz wurde erfolgreich abgerufen.
InstallCertificateSuccessful=das Zertifikat wurde erfolgreich installiert.
Success=\nErfolgreich: Ihre App wurde erfolgreich installiert.
WarningInstallCert=\nSie sind dabei, ein digitales Zertifikat im Zertifikatspeicher "Vertrauenswürdige Personen" Ihres Computers zu installieren. Diese Aktion stellt ein ernstzunehmendes Risiko dar und sollte nur ausgeführt werden, wenn Sie dem Aussteller dieses digitalen Zertifikats vertrauen.\n\nSie sollten das zugeordnete digitale Zertifikat manuell deinstallieren, wenn Sie mit der Verwendung dieser App fertig sind. Anweisungen zu diesem Vorgang finden Sie hier: http://go.microsoft.com/fwlink/?LinkId=243053\n\nMöchten Sie den Vorgang wirklich fortsetzen?\n\n
ElevateActions=\nFühren Sie vor dem Installieren dieser App die folgenden Schritte aus:
ElevateActionDevLicense=\t- Erwerben Sie eine Entwicklerlizenz
ElevateActionCertificate=\t- Installieren Sie das Signaturzertifikat
ElevateActionsContinue=Zum Fortfahren sind Administratoranmeldeinformationen erforderlich. Akzeptieren Sie die Aufforderung der Benutzerkontensteuerung (UAC) und geben Sie Ihr Administratorkennwort ein, wenn Sie dazu aufgefordert werden.
ErrorForceElevate=Sie müssen Administratoranmeldeinformationen eingeben, um fortzufahren. Führen Sie dieses Skript ohne den "-Force"-Parameter oder von einem PowerShell-Fenster mit erhöhten Rechten aus.
ErrorForceDeveloperLicense=Für den Erwerb einer Entwicklerlizenz ist eine Interaktion des Benutzers erforderlich. Führen Sie das Skript ohne den "-Force"-Parameter erneut aus.
ErrorLaunchAdminFailed=Fehler: Es konnte kein neuer Prozess als Administrator gestartet werden.
ErrorNoScriptPath=Fehler: Sie müssen dieses Skript aus einer Datei heraus starten.
ErrorNoPackageFound=Fehler: Im Skriptverzeichnis wurde kein Paket oder Bundle gefunden. Stellen Sie sicher, dass sich das Paket bzw. Bundle, das Sie installieren möchten, im selben Verzeichnis befindet wie dieses Skript.
ErrorManyPackagesFound=Fehler: Im Skriptverzeichnis wurde mehr als ein Paket bzw. Bundle gefunden. Stellen Sie sicher, dass sich nur das Paket bzw. Bundle, das Sie installieren möchten, im selben Verzeichnis befindet wie dieses Skript.
ErrorPackageUnsigned=Fehler: Das Paket bzw. Bundle ist nicht digital signiert, oder die Signatur ist beschädigt.
ErrorNoCertificateFound=Fehler: Im Skriptverzeichnis wurde kein Zertifikat gefunden. Stellen Sie sicher, dass sich das Zertifikat, das zum Signieren des zu installierenden Pakets oder Bundles verwendet wurde, im selben Verzeichnis befindet wie dieses Skript.
ErrorManyCertificatesFound=Fehler: Im Skriptverzeichnis wurde mehr als ein Zertifikat gefunden. Stellen Sie sicher, dass sich nur das Zertifikat, das zum Signieren des zu installierenden Pakets oder Bundles verwendet wurde, im selben Verzeichnis befindet wie dieses Skript.
ErrorBadCertificate=Fehler: Die Datei "{0}" ist kein gültiges digitales Zertifikat. CertUtil wurde mit dem Fehlercode {1} zurückgegeben.
ErrorExpiredCertificate=Fehler: Das Entwicklerzertifikat "{0}" ist abgelaufen. Eine mögliche Ursache ist, dass die Systemuhr nicht auf das richtige Datum und die richtige Uhrzeit eingestellt ist. Wenden Sie sich an den App-Inhaber, damit dieser ein Paket oder Bundle mit einem gültigen Zertifikat erstellt, wenn die Systemeinstellungen richtig sind.
ErrorCertificateMismatch=Fehler: Das Zertifikat stimmt nicht mit dem Zertifikat überein, das zum Signieren des Pakets oder Bundles verwendet wurde.
ErrorCertIsCA=Fehler: Das Zertifikat darf keine Zertifizierungsstelle sein.
ErrorBannedKeyUsage=Fehler: Das Zertifikat darf nicht über die folgende Schlüsselverwendung verfügen: {0}. Die Schlüsselverwendung darf nicht angegeben sein oder muss "DigitalSignature" entsprechen.
ErrorBannedEKU=Fehler: Das Zertifikat darf nicht die folgende erweiterte Schlüsselverwendung besitzen: {0}. Es sind nur die EKUs "Codesignieren" und "Lebensdauersignieren" zulässig.
ErrorNoBasicConstraints=Fehler: Die Basiseinschränkungsextension des Zertifikats fehlt.
ErrorNoCodeSigningEku=Fehler: Die erweiterte Schlüsselverwendung des Zertifikats für das Codesignieren fehlt.
ErrorInstallCertificateCancelled=Fehler: Die Installation des Zertifikats wurde abgebrochen.
ErrorCertUtilInstallFailed=Fehler: Das Zertifikat konnte nicht installiert werden. CertUtil wurde mit dem Fehlercode "{0}" zurückgegeben.
ErrorGetDeveloperLicenseFailed=Fehler: Es konnte keine Entwicklerlizenz erworben werden. Weitere Informationen finden Sie unter http://go.microsoft.com/fwlink/?LinkID=252740.
ErrorInstallCertificateFailed=Fehler: Das Zertifikat konnte nicht installiert werden. Status: {0}. Weitere Informationen finden Sie unter http://go.microsoft.com/fwlink/?LinkID=252740.
ErrorAddPackageFailed=Fehler: Die App konnte nicht installiert werden.
ErrorAddPackageFailedWithCert=Fehler: Die App konnte nicht installiert werden. Zur Wahrung der Sicherheit sollten Sie die Deinstallation des Signaturzertifikats in Betracht ziehen, bis Sie die App installieren können. Anweisungen zu diesem Vorgang finden Sie unter:\nhttp://go.microsoft.com/fwlink/?LinkId=243053
'@
