// qrcode-generator.js - QR Code generator untuk PDF
class QRCodeGenerator {
    static generateQRCodeDataURL(text, size = 120) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = size;
            canvas.height = size;
            
            // Background putih
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            
            // Generate QR code sederhana (pattern-based)
            this.drawSimpleQRCode(ctx, text, size);
            
            resolve(canvas.toDataURL('image/png'));
        });
    }
    
    static drawSimpleQRCode(ctx, text, size) {
        // Warna hitam untuk QR code
        ctx.fillStyle = '#000000';
        
        // Encode text ke binary sederhana
        const binaryText = this.textToBinary(text);
        const data = binaryText.substring(0, 64); // Ambil 64 bit pertama
        
        // Draw QR pattern sederhana
        const moduleSize = size / 8;
        
        for (let i = 0; i < 64; i++) {
            if (data[i] === '1') {
                const x = (i % 8) * moduleSize;
                const y = Math.floor(i / 8) * moduleSize;
                ctx.fillRect(x, y, moduleSize, moduleSize);
            }
        }
        
        // Tambain finder patterns (kotak di 3 sudut)
        this.drawFinderPattern(ctx, 0, 0, moduleSize);
        this.drawFinderPattern(ctx, size - 7 * moduleSize, 0, moduleSize);
        this.drawFinderPattern(ctx, 0, size - 7 * moduleSize, moduleSize);
    }
    
    static drawFinderPattern(ctx, x, y, moduleSize) {
        ctx.fillStyle = '#000000';
        // Outer black square
        ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
        
        ctx.fillStyle = '#ffffff';
        // Inner white square
        ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
        
        ctx.fillStyle = '#000000';
        // Inner black square
        ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
    }
    
    static textToBinary(text) {
        let binary = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            binary += charCode.toString(2).padStart(8, '0');
        }
        return binary;
    }
    
    static async generateSenpiQRCode(nrp, nomorSeri) {
        const verificationUrl = `https://serverazka.github.io/sistem-tracking/verify.html?nrp=${nrp}&senpi=${nomorSeri}`;
        return await this.generateQRCodeDataURL(verificationUrl);
    }
}