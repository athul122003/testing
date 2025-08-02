import { CertificateProvider } from "../../providers/certificateContext";
import CertificatePage from "./certificate-page";

export default function CertificatePageWrapper() {
	return (
		<CertificateProvider>
			<CertificatePage />
		</CertificateProvider>
	);
}
