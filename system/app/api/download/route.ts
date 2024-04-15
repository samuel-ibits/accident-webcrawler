import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';


type GetParams = {
    params: {
        filename: string;
    };
};


export async function GET(req: NextApiRequest, { params }: GetParams, res: NextApiResponse) {
    // filename for the file that the user is trying to download
    console.log(req.query)

    const filename = params.filename;

    if (!filename || typeof filename !== 'string') {
        // If filename is missing or not a string, return a 400 error
        return res.status(400).end('Invalid filename');
    }

    // Path to the public directory
    const publicFolder = path.join(process.cwd(), 'public');

    // Construct the full path to the file
    const filePath = path.join(publicFolder, 'downloads', filename);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        // Read the file
        const fileStream = fs.createReadStream(filePath);

        // Set the appropriate headers for the file download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        // Pipe the file stream to the response
        fileStream.pipe(res);
    } else {
        // File not found, return 404
        res.status(404).end('File not found');
    }
}
