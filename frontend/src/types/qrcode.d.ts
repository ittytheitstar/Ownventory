declare module 'qrcode' {
  type QrCodeOptions = {
    type?: 'svg' | 'utf8' | 'terminal';
    margin?: number;
    width?: number;
  };

  const QRCode: {
    toString(text: string, options?: QrCodeOptions): Promise<string>;
  };

  export default QRCode;
}
