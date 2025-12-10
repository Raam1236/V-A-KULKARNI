
import React, { useRef } from 'react';
import { useAppContext } from '../../hooks/useAppContext';

const CertificateGenerator: React.FC = () => {
    const { shopDetails } = useAppContext();
    const certificateRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = certificateRef.current?.innerHTML;
        if (content) {
            const printWindow = window.open('', '', 'height=800,width=1000');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Print Certificate</title>');
                printWindow.document.write(`
                    <style>
                        @media print {
                            @page { 
                                size: landscape;
                                margin: 0;
                            }
                            body { 
                                font-family: "Times New Roman", Serif;
                                margin: 0;
                                padding: 0;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                            .certificate-container {
                                width: 100%;
                                height: 100vh;
                                position: relative;
                                background: #fff;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                            }
                            .border-fancy {
                                width: 95%;
                                height: 90%;
                                border: 10px solid #B8860B; /* Dark GoldenRod */
                                position: relative;
                                padding: 5px;
                                box-sizing: border-box;
                            }
                            .border-inner {
                                width: 100%;
                                height: 100%;
                                border: 2px solid #DAA520;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                position: relative;
                                background-image: radial-gradient(circle, #fffff0 10%, #fff 100%);
                            }
                            .seal {
                                position: absolute;
                                bottom: 40px;
                                right: 60px;
                                width: 150px;
                                height: 150px;
                            }
                            .title {
                                font-size: 50px;
                                font-weight: bold;
                                color: #B8860B;
                                text-transform: uppercase;
                                margin-bottom: 20px;
                                letter-spacing: 2px;
                            }
                            .subtitle {
                                font-size: 24px;
                                color: #333;
                                margin-bottom: 40px;
                                font-style: italic;
                            }
                            .recipient {
                                font-size: 48px;
                                font-weight: bold;
                                color: #000;
                                border-bottom: 2px solid #ccc;
                                padding: 0 40px 10px 40px;
                                margin-bottom: 30px;
                                text-align: center;
                            }
                            .body-text {
                                font-size: 18px;
                                text-align: center;
                                width: 80%;
                                line-height: 1.6;
                                color: #444;
                                margin-bottom: 50px;
                            }
                            .signature-section {
                                display: flex;
                                justify-content: space-between;
                                width: 80%;
                                margin-top: 50px;
                            }
                            .sig-block {
                                text-align: center;
                            }
                            .sig-line {
                                width: 250px;
                                border-top: 1px solid #333;
                                margin-top: 50px;
                                padding-top: 10px;
                                font-weight: bold;
                            }
                            .watermark {
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%) rotate(-30deg);
                                font-size: 100px;
                                color: rgba(184, 134, 11, 0.05);
                                font-weight: bold;
                                z-index: 0;
                                pointer-events: none;
                                white-space: nowrap;
                            }
                            .badge-text {
                                font-size: 14px;
                                font-weight: bold;
                                text-transform: uppercase;
                                color: #B8860B;
                                border: 2px solid #B8860B;
                                padding: 5px 10px;
                                border-radius: 4px;
                                position: absolute;
                                top: 40px;
                                right: 40px;
                            }
                        }
                    </style>
                `);
                printWindow.document.write('</head><body>');
                printWindow.document.write(content);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 500);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-on-surface">License & Security Certificate</h1>
                <button
                    onClick={handlePrint}
                    className="py-2 px-6 bg-secondary text-on-primary font-bold rounded-full hover:bg-green-600 transition shadow-lg flex items-center gap-2"
                >
                    <PrinterIcon /> Print / Download PDF
                </button>
            </div>

            <div className="bg-gray-200 p-8 rounded-lg overflow-auto flex justify-center shadow-inner">
                {/* Visual Preview Container */}
                <div 
                    ref={certificateRef}
                    style={{ width: '1000px', height: '700px', background: 'white' }}
                    className="certificate-container shadow-2xl scale-90 origin-top"
                >
                    {/* Inline styles for preview matching print styles */}
                    <div className="border-fancy" style={{
                        width: '95%', height: '90%', border: '10px solid #B8860B', padding: '5px', boxSizing: 'border-box', margin: 'auto', position: 'relative', top: '2.5%'
                    }}>
                        <div className="border-inner" style={{
                            width: '100%', height: '100%', border: '2px solid #DAA520', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative',
                            backgroundImage: 'radial-gradient(circle, #fffff0 10%, #fff 100%)'
                        }}>
                            {/* Watermark */}
                            <div className="watermark" style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)',
                                fontSize: '100px', color: 'rgba(184, 134, 11, 0.05)', fontWeight: 'bold', zIndex: 0, pointerEvents: 'none', whiteSpace: 'nowrap'
                            }}>
                                RG CERTIFIED
                            </div>

                            <div className="badge-text" style={{
                                fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: '#B8860B', border: '2px solid #B8860B',
                                padding: '5px 10px', borderRadius: '4px', position: 'absolute', top: '40px', right: '40px'
                            }}>
                                Enterprise Edition
                            </div>

                            <h1 className="title" style={{
                                fontSize: '50px', fontWeight: 'bold', color: '#B8860B', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '2px', fontFamily: 'Times New Roman'
                            }}>
                                Certificate of License
                            </h1>
                            <p className="subtitle" style={{ fontSize: '24px', color: '#333', marginBottom: '30px', fontStyle: 'italic', fontFamily: 'Georgia' }}>
                                This is to certify that the software installation for
                            </p>

                            <div className="recipient" style={{
                                fontSize: '48px', fontWeight: 'bold', color: '#000', borderBottom: '2px solid #ccc', padding: '0 40px 10px 40px', marginBottom: '30px', textAlign: 'center', fontFamily: 'Times New Roman'
                            }}>
                                {shopDetails.name}
                            </div>

                            <div className="body-text" style={{ fontSize: '18px', textAlign: 'center', width: '80%', lineHeight: 1.6, color: '#444', marginBottom: '40px', fontFamily: 'Georgia' }}>
                                Has been successfully verified and secured with <strong>RG Shop Billing Pro</strong>.
                                <br />
                                This certificate confirms that the user is operating a licensed version of the software, 
                                equipped with Advanced AI Security (WAF/Firewall Compliant) and Enterprise Billing Standards.
                            </div>

                            <div className="signature-section" style={{ display: 'flex', justifyContent: 'space-between', width: '80%', marginTop: '30px' }}>
                                <div className="sig-block" style={{ textAlign: 'center' }}>
                                    <div style={{ fontFamily: 'Cursive', fontSize: '24px', color: '#2563eb' }}>{new Date().toLocaleDateString()}</div>
                                    <div className="sig-line" style={{ width: '250px', borderTop: '1px solid #333', marginTop: '10px', paddingTop: '10px', fontWeight: 'bold' }}>
                                        Date of Issue
                                    </div>
                                </div>
                                <div className="sig-block" style={{ textAlign: 'center' }}>
                                    {/* Gold Seal Graphic */}
                                    <div style={{ width: '120px', height: '120px', background: '#B8860B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', border: '4px double white', position: 'relative', top: '-60px', right: '-40px' }}>
                                        <div style={{ border: '1px dashed white', width: '90%', height: '90%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            OFFICIAL<br/>SEAL
                                        </div>
                                    </div>
                                </div>
                                <div className="sig-block" style={{ textAlign: 'center' }}>
                                    <div style={{ fontFamily: 'Cursive', fontSize: '24px', color: '#2563eb' }}>RG Creations</div>
                                    <div className="sig-line" style={{ width: '250px', borderTop: '1px solid #333', marginTop: '10px', paddingTop: '10px', fontWeight: 'bold' }}>
                                        Authorized Signature
                                    </div>
                                </div>
                            </div>

                            <div style={{ position: 'absolute', bottom: '10px', fontSize: '10px', color: '#999' }}>
                                ID: {shopDetails.contact.replace(/\D/g,'').slice(0,10)}-{Date.now()} | Valid Lifetime License
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="text-center mt-4 text-sm text-on-surface/60">
                Click "Print / Download PDF" and select "Save as PDF" in the print dialog.
            </div>
        </div>
    );
};

const PrinterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>;

export default CertificateGenerator;
