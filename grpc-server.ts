import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import pdf from 'html-pdf';
import * as path from 'path';

const PROTO_PATH = path.join(__dirname, 'proto', 'HTML2PDFConverter.proto');

// Load the .proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const html2pdfProto = protoDescriptor.HTML2PDFConverter as grpc.ServiceClientConstructor;

const server = new grpc.Server();

server.addService(html2pdfProto.service, {
  ConvertHTMLToPDF: (
    call: grpc.ServerUnaryCall<{ data: Uint8Array }, { data: Buffer }>,
    callback: grpc.sendUnaryData<{ data: Buffer }> 
  ) => {
    const htmlContent = Buffer.from(call.request.data).toString('utf-8');

    pdf.create(htmlContent).toBuffer((err: Error | null, buffer: Buffer) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, { data: buffer });
    });
  },
});

// Start the gRPC server
server.bindAsync(
  '0.0.0.0:50051',
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log('✅ gRPC Server running on port 50051');
    server.start();
  }
);
