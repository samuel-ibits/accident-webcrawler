// import fs from 'fs';
import path from 'path';
// import { NextApiRequest, NextApiResponse } from 'next';

// type GetParams = {
//     params: {
//         filename: string;
//     };
// };


// export async function GET(req: NextApiRequest, { params }: GetParams, res: NextApiResponse) {
//     // filename for the file that the user is trying to download

//     const filename = params.filename;
//     console.log(filename)


//     if (!filename || typeof filename !== 'string') {
//         // If filename is missing or not a string, return a 400 error
//         return res.status(400).end('Invalid filename');
//     }


//     // Path to the public directory
//     const publicFolder = path.join(process.cwd(), 'public');

//     // Construct the full path to the file
//     const filePath = path.join(publicFolder, 'downloads', filename);
//     const response = await fetch(filePath);


//     // return a new response but use 'content-disposition' to suggest saving the file to the user's computer
//     return new Response(response.body, {
//         headers: {
//             ...response.headers, // copy the previous headers
//             "content-disposition": `attachment; filename="${filename}"`,
//         },
//     });
// }

type GetParams = {
    params: {
        filename: string;
    };
};

// export an async GET function. This is a convention in NextJS
export async function GET(req: Request, { params }: GetParams) {
    // filename for the file that the user is trying to download
    const filename = params.filename;

    // Path to the public directory
    const publicFolder = path.join(process.cwd(), 'public');

    // Construct the full path to the file
    const filePath = path.join(publicFolder, 'downloads', filename);
    console.log(filePath)

    // external file URL
    const DUMMY_URL = "http://localhost:3000/downloads/dummy.pdf";

    // use fetch to get a response
    const response = await fetch(DUMMY_URL);

    // return a new response but use 'content-disposition' to suggest saving the file to the user's computer
    return new Response(response.body, {
        headers: {
            ...response.headers, // copy the previous headers
            "content-disposition": `attachment; filename="${filename}"`,
        },
    });
}

