const { getInstances, getProxies } = require("../redis");
const { getGamemodes, getGamemodeContent, updateGamemodeContent, toggleGamemode, deleteGamemode, createGamemode,
    restartGamemode
} = require("../gamemodes");
const { register, verify, verifyLogin, login} = require("../authentication");
const {getInviteCodes, createInviteCode, revokeInviteCode, getUsers, setAdmin, resetPassword, deleteUser, logout,
    getUser, getUserByID
} = require("../database");
const {verifyInvite} = require("../inviteCodes");
const {deleteSFTPDirectory, createSFTPDirectory, deleteSFTPFile, updateSFTPFile, createSFTPFile, listSFTPFiles,
    getSFTPFileContent, downloadSFTPFile, uploadSFTPFile, moveFileOrFolder, listSFTPRecursive
} = require("../sftp");
const multer = require("multer");
const JSZip = require("jszip");
const config = require("../../config");
const {unarchiveFile} = require("../unzip");

module.exports = {
    getInstances: async (req, res) => {
        const instances = await getInstances();
        res.json(instances);
    },

    getProxies: async (req, res) => {
        const proxies = await getProxies();
        res.json(proxies);
    },

    getGamemodes: async (req, res) => {
        try {
            const gamemodes = await getGamemodes();
            res.json(gamemodes);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch gamemodes' });
        }
    },

    getGamemodeContent: async (req, res) => {
        try {
            const { name } = req.params;
            const content = await getGamemodeContent(name);
            res.json({ content });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch gamemode content' });
        }
    },

    updateGamemodeContent: async (req, res) => {
        try {
            const { name } = req.params;
            const { content } = req.body;
            await updateGamemodeContent(name, content);
            res.json({ message: 'Gamemode updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update gamemode' });
        }
    },

    toggleGamemode: async (req, res) => {
        try {
            const { name } = req.params;
            const { enabled } = req.body;
            await toggleGamemode(name, enabled);
            res.json({ message: 'Gamemode toggled successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to toggle gamemode' });
        }
    },

    deleteGamemode: async (req, res) => {
        try {
            const {name} = req.params;
            await deleteGamemode(name);
            res.json({message: 'Gamemode deleted successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to delete gamemode'});
        }
    },

    createGamemode: async (req, res) => {
        try {
            const {name} = req.body;
            await createGamemode(name);
            res.json({message: 'Gamemode created successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to create gamemode'});
        }
    },

    restartGamemode: async (req, res) => {
        try {
            const {name} = req.params;
            await restartGamemode(name);
            res.json({message: 'Gamemode restarted successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to restart gamemode'});
        }
    },

    register: async (req, res) => {
        const { username, password, inviteToken } = req.body;
        try {
            const data_url = await register(username, password, inviteToken);
            res.json({ message: 'User registered successfully', qrCode: data_url });
        } catch (error) {
            if (error.message === 'User already exists') {
                return res.status(400).json({ error: 'User already exists' });
            }

            res.status(500).json({ error: 'Failed to register user' });
        }
    },

    verify: async (req, res) => {
        const { username, token, inviteToken } = req.body;
        try {
            const loginToken = await verify(username, token, inviteToken);
            let dbUser = await getUser(username);
            let isAdmin = dbUser.is_admin;
            res.json({ loginToken, isAdmin });
        } catch (error) {
            res.status(500).json({ error: 'Failed to verify token' });
        }
    },

    login: async (req, res) => {
        const { username, password } = req.body;
        try {
            const sessionToken = await login(username, password);
            res.json({ sessionToken });
        } catch (error) {
            res.status(500).json({ error: 'Failed to login' });
        }
    },

    verifyLogin: async (req, res) => {
        const { username, token, sessionToken } = req.body;
        try {
            const loginToken = await verifyLogin(username, token, sessionToken);
            let dbUser = await getUser(username);
            let isAdmin = dbUser.is_admin;

            res.json({ verified: true, token: loginToken, isAdmin: isAdmin });
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to verify login' });
        }
    },

    getInviteCodes: async (req, res) => {
        try {
            const codes = await getInviteCodes();
            res.json(codes);
        } catch (error) {
            console.log(error);
            res.status(500).json({error: 'Failed to fetch invite codes'});
        }
    },

    createInviteCode: async (req, res) => {
        const {message} = req.body;
        try {
            await createInviteCode(message);
            res.json({message: 'Invite code created successfully'});
        } catch (error) {
            console.log(error);
            res.status(500).json({error: 'Failed to create invite code'});
        }
    },

    revokeInviteCode: async (req, res) => {
        const {code} = req.params;
        try {
            await revokeInviteCode(code);
            res.json({message: 'Invite code revoked successfully'});
        } catch (error) {
            console.log(error);
            res.status(500).json({error: 'Failed to revoke invite code'});
        }
    },

    verifyInvite: async (req, res) => {
        const {inviteCode} = req.body;
        try {
            let token = await verifyInvite(inviteCode);
            res.json({ token });
        } catch (error) {
            console.log(error);
            res.status(500).json({error: 'Invalid invite code'});
        }
    },

    getUsers: async (req, res) => {
        try {
            const users = await getUsers();
            res.json(users);
        } catch (error) {
            res.status(500).json({error: 'Failed to fetch users'});
        }
    },

    async setAdmin(req, res) {
        const {id} = req.params;
        const {is_admin} = req.body;

        try {
            await setAdmin(id, is_admin);
            let dbUser = await getUserByID(id);
            await logout(dbUser.username);

            res.json({message: 'Updated user admin status'});
        } catch (error) {
            res.status(500).json({error: 'Failed to set user admin status'});
        }
    },

    async resetPassword(req, res) {
        const {id} = req.params;
        const {password} = req.body;

        try {
            await resetPassword(id, password);
            res.json({message: 'Password reset successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to reset password'});
        }
    },

    async deleteUser(req, res) {
        const {id} = req.params;

        try {
            await deleteUser(id);
            res.json({message: 'User deleted successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to delete user'});
        }
    },

    async logout(req, res) {
        try {
            await logout(req.user.username);
        } catch (error) {
            res.status(500).json({error: 'Failed to log out user'});
        }

        res.json({message: 'Logged out successfully'});
    },

    getSFTPFiles: async (req, res) => {
        const { path } = req.query;

        try {
            const files = await listSFTPFiles(path);
            res.json(files);
        } catch (error) {
            res.status(500).json({ error: 'Failed to list files' });
        }
    },

    getSFTPFileContent: async (req, res) => {
        const { path } = req.query;

        try {
            const fileContent = await getSFTPFileContent(path);
            res.json({ content: fileContent });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get file content' });
        }
    },

    createSFTPFile: async (req, res) => {
        const { path, content } = req.body;
        try {
            await createSFTPFile(path, content);
            res.json({ message: 'File created successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to create file' });
        }
    },

    updateSFTPFile: async (req, res) => {
        const { path, content } = req.body;
        try {
            await updateSFTPFile(path, content);
            res.json({ message: 'File updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update file' });
        }
    },

    deleteSFTPFile: async (req, res) => {
        const { path } = req.query;
        try {
            await deleteSFTPFile(path);
            res.json({ message: 'File deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete file' });
        }
    },

    createSFTPDirectory: async (req, res) => {
        const { path } = req.body;
        try {
            await createSFTPDirectory(path);
            res.json({ message: 'Directory created successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to create directory' });
        }
    },

    deleteSFTPDirectory: async (req, res) => {
        const { path } = req.query;
        try {
            await deleteSFTPDirectory(path);
            res.json({ message: 'Directory deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete directory' });
        }
    },

    uploadSFTPFiles: async (req, res) => {
        const storage = multer.memoryStorage();
        const upload = multer({
            storage: storage,
            limits: {
                fileSize: config["max-upload-size-mb"] * 1024 * 1024
            }
        }).array('files');

        try {
            await new Promise((resolve, reject) => {
                upload(req, res, (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });

            if (!req.files?.length) {
                return res.status(400).json({ error: 'No files provided' });
            }

            await uploadSFTPFile(req.files, req.body.path);
            res.json({ message: 'Files uploaded successfully' });
        } catch (error) {
            console.error('Error in upload process:', error);
            res.status(500).json({ error: 'Failed to upload files: ' + error.message });
        }
    },

    downloadSFTPFile: async (req, res) => {
        const { path } = req.query;

        try {
            const fileBuffer = await downloadSFTPFile(path);
            const filename = path.split('/').pop();

            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/octet-stream');

            res.send(fileBuffer);
        } catch (error) {
            console.error('Error downloading file:', error);
            res.status(500).json({ error: 'Failed to download file' });
        }
    },

    downloadSFTPFiles: async (req, res) => {
        const { files } = req.body;

        if (!files?.length) return res.status(400).json({ error: 'No files specified for download' });

        const zip = new JSZip();

        try {
            for (const file of files) {
                const pathContents = await listSFTPFiles(file.path.split('/').slice(0, -1).join('/'));
                const fileInfo = pathContents.find(f => f.name === file.path.split('/').pop());

                if (fileInfo && fileInfo.type === 'd') {
                    const contents = await listSFTPFiles(file.path);
                    for (const item of contents) {
                        if (item.type !== 'd') {
                            const fileBuffer = await downloadSFTPFile(item.path);
                            zip.file(`${file.name}/${item.name}`, fileBuffer);
                        }
                    }
                } else {
                    const fileBuffer = await downloadSFTPFile(file.path);
                    zip.file(file.name, fileBuffer);
                }
            }

            const zipBuffer = await zip.generateAsync({
                type: 'nodebuffer',
                compression: 'DEFLATE'
            });

            res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');
            res.setHeader('Content-Type', 'application/zip');
            res.send(zipBuffer);

        } catch (error) {
            res.status(500).json({ error: 'Failed to process files' });
        }
    },
    archiveSFTPFile: async (req, res) => {
        const { path } = req.body;

        try {
            const fileBuffer = await downloadSFTPFile(path);
            const filename = path.split('/').pop();
            const directoryPath = path.split('/').slice(0, -1).join('/');
            const zip = new JSZip();

            zip.file(filename, fileBuffer);

            const zipBuffer = await zip.generateAsync({
                type: 'nodebuffer',
                compression: 'DEFLATE'
            });
            const archivePath = `${directoryPath}/${filename}.zip`;
            await uploadSFTPFile(zipBuffer, archivePath);

            res.json({
                success: true,
                message: 'File archived successfully',
                archivePath: archivePath
            });
        } catch (error) {
            console.error('Error archiving file:', error);
            res.status(500).json({ error: 'Failed to archive file' });
        }
    },

    archiveSFTPFiles: async (req, res) => {
        const { files } = req.body;

        if (!files?.length) return res.status(400).json({ error: 'No files specified for archive' });

        const zip = new JSZip();
        const currentDirectory = files[0].path.split('/').slice(0, -1).join('/');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveName = `archive_${timestamp}.zip`;

        try {
            for (const file of files) {
                const pathContents = await listSFTPFiles(file.path.split('/').slice(0, -1).join('/'));
                const fileInfo = pathContents.find(f => f.name === file.path.split('/').pop());

                if (fileInfo && fileInfo.type === 'd') {
                    const folderContents = await listSFTPRecursive(file.path);
                    for (const item of folderContents) {
                        if (item.type !== 'd') {
                            const relativePath = item.path.replace(file.path, '').replace(/^\//, '');
                            const fileBuffer = await downloadSFTPFile(item.path);
                            zip.file(`${file.name}/${relativePath}`, fileBuffer);
                        }
                    }
                } else {
                    const fileBuffer = await downloadSFTPFile(file.path);
                    zip.file(file.name, fileBuffer);
                }
            }

            const zipBuffer = await zip.generateAsync({
                type: 'nodebuffer',
                compression: 'DEFLATE',
                comment: `Archived on ${new Date().toISOString()}`
            });

            const archivePath = `${currentDirectory}/${archiveName}`;
            await uploadSFTPFile(zipBuffer, archivePath);

            res.json({
                success: true,
                message: 'Files archived successfully',
                archivePath: archivePath
            });

        } catch (error) {
            console.error('Error archiving files:', error);
            res.status(500).json({ error: 'Failed to process files' });
        }
    },

    unarchiveSFTPFile: async (req, res) => {
        const { path } = req.body;
        try {
            await unarchiveFile(path);

            res.json({ message: 'File unarchived successfully' });
        } catch (error) {
            console.error('Error unarchiving file:', error);
            res.status(500).json({ error: 'Failed to unarchive file' });
        }
    },

    moveSFTPFile: async (req, res) => {
        const { sourcePath, targetPath } = req.body;
        try {
            await moveFileOrFolder(sourcePath, targetPath);
            res.json({ message: 'File(s) moved successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to move file(s)' });
        }
    },
};

