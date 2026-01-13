import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PixQRCodeProps {
  pixKey: string;
  pixKeyType: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid?: string;
  description?: string;
}

// Generate PIX EMV payload (BR Code format)
function generatePixPayload({
  pixKey,
  pixKeyType,
  merchantName,
  merchantCity,
  amount,
  txid = '***',
  description,
}: {
  pixKey: string;
  pixKeyType: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid?: string;
  description?: string;
}): string {
  // Clean and format values
  const cleanMerchantName = merchantName.substring(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
  const cleanMerchantCity = merchantCity.substring(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
  const cleanTxid = txid.substring(0, 25).replace(/[^a-zA-Z0-9]/g, '');
  
  // Format amount to 2 decimal places
  const formattedAmount = amount.toFixed(2);

  // Helper function to create TLV (Tag-Length-Value) format
  const tlv = (tag: string, value: string) => {
    const length = value.length.toString().padStart(2, '0');
    return `${tag}${length}${value}`;
  };

  // Build PIX Key field (ID 01 inside merchant account - 26)
  // GUI is always "br.gov.bcb.pix" for PIX
  const gui = tlv('00', 'br.gov.bcb.pix');
  const key = tlv('01', pixKey);
  let merchantAccountInfo = gui + key;
  
  if (description) {
    const cleanDescription = description.substring(0, 72);
    merchantAccountInfo += tlv('02', cleanDescription);
  }

  // Build the payload
  let payload = '';
  
  // ID 00 - Payload Format Indicator (mandatory, always "01")
  payload += tlv('00', '01');
  
  // ID 01 - Point of Initiation Method
  // 11 = Static QR Code (can be reused)
  // 12 = Dynamic QR Code (single use)
  payload += tlv('01', '12');
  
  // ID 26 - Merchant Account Information
  payload += tlv('26', merchantAccountInfo);
  
  // ID 52 - Merchant Category Code (0000 = not informed)
  payload += tlv('52', '0000');
  
  // ID 53 - Transaction Currency (986 = BRL)
  payload += tlv('53', '986');
  
  // ID 54 - Transaction Amount
  if (amount > 0) {
    payload += tlv('54', formattedAmount);
  }
  
  // ID 58 - Country Code (BR)
  payload += tlv('58', 'BR');
  
  // ID 59 - Merchant Name
  payload += tlv('59', cleanMerchantName);
  
  // ID 60 - Merchant City
  payload += tlv('60', cleanMerchantCity);
  
  // ID 62 - Additional Data Field Template
  const additionalData = tlv('05', cleanTxid); // ID 05 = Reference Label (txid)
  payload += tlv('62', additionalData);
  
  // ID 63 - CRC16 (to be calculated)
  // Add the CRC16 tag and length placeholder
  payload += '6304';
  
  // Calculate CRC16 CCITT-FALSE
  const crc = calculateCRC16(payload);
  payload += crc;
  
  return payload;
}

// CRC16 CCITT-FALSE calculation
function calculateCRC16(str: string): string {
  let crc = 0xFFFF;
  
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
    crc &= 0xFFFF;
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export const PixQRCode = ({
  pixKey,
  pixKeyType,
  merchantName,
  merchantCity,
  amount,
  txid,
  description,
}: PixQRCodeProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [pixPayload, setPixPayload] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const payload = generatePixPayload({
          pixKey,
          pixKeyType,
          merchantName,
          merchantCity,
          amount,
          txid,
          description,
        });
        
        setPixPayload(payload);
        
        const url = await QRCode.toDataURL(payload, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        });
        
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    if (pixKey && amount > 0) {
      generateQR();
    }
  }, [pixKey, pixKeyType, merchantName, merchantCity, amount, txid, description]);

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar código');
    }
  };

  if (!pixKey || amount <= 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <QrCode className="w-6 h-6 text-primary" />
        <h3 className="font-bold text-lg">Pague com PIX</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Escaneie o QR Code ou copie o código para pagar
      </p>
      
      {qrCodeUrl ? (
        <div className="inline-block bg-white p-3 rounded-xl shadow-lg">
          <img src={qrCodeUrl} alt="QR Code PIX" className="w-48 h-48" />
        </div>
      ) : (
        <div className="w-48 h-48 mx-auto bg-muted rounded-xl animate-pulse" />
      )}
      
      <div className="mt-4 space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleCopyPayload}
          disabled={!pixPayload}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-600" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copiar código PIX
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          O pagamento será confirmado automaticamente após a transferência
        </p>
      </div>
    </div>
  );
};
