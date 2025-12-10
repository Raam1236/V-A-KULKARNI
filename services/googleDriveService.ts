
// Services for Google Drive Integration

// IMPORTANT: Requires a Google Cloud Project with the Drive API enabled.
// You must add 'http://localhost:5173' (or your domain) to "Authorized JavaScript origins" in the Google Cloud Console.

export const TARGET_EMAIL = "gabittukaram@gmail.com";
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// --- Placeholder Client ID ---
// In a real deployment, this should be in an environment variable or secure config.
// Since we are running in a user's browser, we'll allow them to input it if missing, or use a default if provided.
let CLIENT_ID = localStorage.getItem('rg_google_client_id') || ''; 

let tokenClient: any;
let gapiInited = false;
let gisInited = false;
let accessToken: string | null = null;
let tokenExpiry = 0;

export const setClientId = (id: string) => {
    CLIENT_ID = id;
    localStorage.setItem('rg_google_client_id', id);
};

export const getClientId = () => CLIENT_ID;

export const initGoogleDrive = async (): Promise<boolean> => {
    if (!CLIENT_ID) return false;

    return new Promise((resolve) => {
        const checkScripts = setInterval(() => {
            if ((window as any).gapi && (window as any).google) {
                clearInterval(checkScripts);
                
                (window as any).gapi.load('client', async () => {
                    await (window as any).gapi.client.init({
                        discoveryDocs: [DISCOVERY_DOC],
                    });
                    gapiInited = true;
                    maybeResolve();
                });

                tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: async (resp: any) => {
                        if (resp.error) {
                            throw resp;
                        }
                        accessToken = resp.access_token;
                        tokenExpiry = Date.now() + (resp.expires_in * 1000);
                        
                        // Verify Email matches TARGET_EMAIL
                        const email = await getUserEmail();
                        if (email !== TARGET_EMAIL) {
                            alert(`Unauthorized Access. This database is locked to ${TARGET_EMAIL}. You logged in as ${email}.`);
                            accessToken = null;
                            if((window as any).google) (window as any).google.accounts.oauth2.revoke(resp.access_token);
                            return;
                        }
                    },
                });
                gisInited = true;
                maybeResolve();
            }
        }, 100);

        function maybeResolve() {
            if (gapiInited && gisInited) resolve(true);
        }
    });
};

const getUserEmail = async (): Promise<string> => {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await response.json();
        return data.email;
    } catch (e) {
        console.error("Error fetching user info", e);
        return "";
    }
};

export const loginToDrive = async (): Promise<string | null> => {
    if (!tokenClient) {
        const inited = await initGoogleDrive();
        if (!inited) throw new Error("Google Drive API not initialized. Missing Client ID.");
    }

    return new Promise((resolve, reject) => {
        tokenClient.callback = async (resp: any) => {
            if (resp.error) {
                reject(resp);
            }
            accessToken = resp.access_token;
            // Verify Email
            const email = await getUserEmail();
            if (email.toLowerCase() === TARGET_EMAIL.toLowerCase()) {
                resolve(email);
            } else {
                alert(`Access Denied! \n\nExpected: ${TARGET_EMAIL}\nFound: ${email}`);
                // Revoke
                (window as any).google.accounts.oauth2.revoke(resp.access_token, () => {});
                accessToken = null;
                resolve(null);
            }
        };
        
        // Use prompt: 'select_account' to force account chooser so user can pick the correct one
        tokenClient.requestAccessToken({ prompt: 'select_account' }); 
    });
};

// --- File Operations ---

const FOLDER_NAME = "RG_Shop_Database";

const getFolderId = async (): Promise<string | null> => {
    const query = `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`;
    const response = await (window as any).gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive',
    });
    const files = response.result.files;
    if (files && files.length > 0) return files[0].id;
    return null;
};

const createFolder = async (): Promise<string> => {
    const fileMetadata = {
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
    };
    const response = await (window as any).gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id',
    });
    return response.result.id;
};

const findFile = async (fileName: string, folderId: string): Promise<string | null> => {
    const query = `name='${fileName}' and '${folderId}' in parents and trashed=false`;
    const response = await (window as any).gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name)',
    });
    if (response.result.files.length > 0) return response.result.files[0].id;
    return null;
};

export const saveDataToDrive = async (fileName: string, data: any) => {
    if (!accessToken) return;

    try {
        let folderId = await getFolderId();
        if (!folderId) folderId = await createFolder();
        
        const fileId = await findFile(fileName, folderId);
        const fileContent = JSON.stringify(data, null, 2);
        
        const file = new Blob([fileContent], { type: 'application/json' });
        const metadata = {
            name: fileName,
            mimeType: 'application/json',
            parents: !fileId ? [folderId] : undefined // Only set parent on create
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        let method = 'POST';

        if (fileId) {
            // Update existing
            url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
            method = 'PATCH';
        }

        await fetch(url, {
            method: method,
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
            body: form
        });

        console.log(`Saved ${fileName} to Drive`);
    } catch (e) {
        console.error(`Error saving ${fileName} to Drive:`, e);
    }
};

export const loadDataFromDrive = async (fileName: string): Promise<any | null> => {
    if (!accessToken) return null;

    try {
        const folderId = await getFolderId();
        if (!folderId) return null;

        const fileId = await findFile(fileName, folderId);
        if (!fileId) return null;

        const response = await (window as any).gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media',
        });

        return response.result; // GAPI returns parsed JSON if content-type is json
    } catch (e) {
        console.error(`Error loading ${fileName} from Drive:`, e);
        return null;
    }
};

export const isAuthenticated = () => !!accessToken;
export const getActiveEmail = () => TARGET_EMAIL;
