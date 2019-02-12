const https = require('https');
const {URL} = require('url');
const querystring = require('querystring');
const axios = require('axios');

/**
 * Synology Nas download station module
 * @version 1.0.0
 * @author Eric Chan
 */
class Nas {
    /**
     * Represents a NAS.
     * @constructor
     * @param {string} url - whole url like https://localhost:50001
     */
    constructor(url) {
        if (url instanceof URL) {
            this._url = url;
        } else if (typeof url === 'string') {
            this._url = new URL(url);
        } else {
            this._url = new URL("https://localhost:5001");
        }

        this._sid = "";
    }

    /**
     * Build api query string with this function.
     * @param {string} path the cgi path
     * @param {object} query all parameters should be save in this object
     * @return {string} escape url with stringify params
     */
    api(path, query) {
        var apistring = this._url.origin + "/webapi/" + path + "?" + querystring.stringify(query);
        return querystring.escape(apistring);
    }

    /**
     * Get all supported api information. Not working for unknown error code 101.
     * @return {Promise} object that list Nas supported api info "api_name": {minVersion: 1, maxVersion: 2, path: "entry.cgi", requestFormat: "JSON"}
     */
    async info() {
        const config = {
            baseURL: this._url.origin,
            url: "/webapi/query.cgi",
            params: {
                api: "SYNO.API.Info",
                version: 1,
                method: "query",
                query: "all"
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        };

        return await axios.request(config)
            .then(function(response) {
                if (response.status == 200) {
                    if (response.data.success) {
                        // console.log(response.data.data);
                        return response.data.data;
                    } else {
                        console.log("API Error Code: " + response.data.error.code);
                    }
                } else {
                    console.log("Http error code: " + response.status);
                }
            })
            .catch(function(error){
                console.log(error);
            })
    }

    /**
     * Login download station with username and password.
     * @param {string} nas_username username of login user
     * @param {string} nas_password password of login user
     * @return {Promise} boolean success on resolve
     */
    async login(nas_username, nas_password) {
        const self = this;
        const config = {
            baseURL: this._url.origin,
            url: "/webapi/auth.cgi",
            params: {
                api: "SYNO.API.Auth",
                version: 6,
                session: "DownloadStation",
                format: "sid",
                method: "login",
                account: nas_username,
                passwd: nas_password
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        };

        return await axios.request(config)
                            .then(function(response) {
                                if (response.status == 200) {
                                    if (response.data.success) {
                                        self._sid = response.data.data.sid;
                                        // console.log("login sid: " + self._sid);
                                        return true;
                                    } else {
                                        switch(response.data.error.code) {
                                            case 400:
                                                console.log("No such account or incorrect password");
                                                break;
                                            case 401:
                                                console.log("Account disabled");
                                                break;
                                            case 402:
                                                console.log("Permission denied");
                                                break;
                                            case 403:
                                                console.log("2-step verification code required");
                                                break;
                                            case 404:
                                                console.log("Failed to authenticate 2-step verification code");
                                                break;
                                        }
                                    }
                                } else {
                                    console.log("Http error code: " + response.status);
                                }
                            })
                            .catch(function(error) {
                                console.log(error);
                            })
    }

    /**
     * Logout the Nas of the download session.
     * @return {Promise} boolean success on resolve
     */
    async logout() {
        const config = {
            baseURL: this._url.origin,
            url: "/webapi/auth.cgi",
            params: {
                api: "SYNO.API.Auth",
                version: 1,
                session: "DownloadStation",
                method: "logout"
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        };

        return await axios.request(config)
                            .then(function(response) {
                                if (response.status == 200) {
                                    // console.log("Logout succeess: " + response.data.success);
                                    return response.data.success;
                                }
                            })
                            .catch(function(error) {
                                console.log(error);
                            })
    }

    /**
     * Get all tasks list.
     * @param {integer} offset begining task on the requested record. default = 0
     * @param {integer} limit number of records requested. default = -1
     * @param {string} [additional] possible options including detail, transfer, file, tracker, peer
     * @return {Promise} tasks object on resolve
     */
    async getTaskList(offset = 0, limit = -1, additional = "") {
        const config = {
            baseURL: this._url.origin,
            url: "/webapi/DownloadStation/task.cgi",
            params: {
                _sid: this._sid,
                api: "SYNO.DownloadStation.Task",
                version: 1,
                method: "list",
                additional: additional
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        };

        return await axios.request(config)
                            .then((response) => {
                                if (response.status == 200) {
                                    if (response.data.success) {
                                        // console.log(response.data);
                                        // console.log(response.data.data.tasks);
                                        return response.data.data.tasks;
                                    }
                                } else {
                                    console.log("Http error code: " + response.status);
                                }
                            })
                            .catch((error) => {
                                console.log(error);
                            });
    }

    /**
     * Get specify Task ID information.
     * @param {string} id Task ID
     * @param {string} additional possible options including detail, transfer, file, tracker, peer 
     * @return {Promise} get speicfy task information on resolve
     */
    async getTaskInfo(id, additional = "") {
        const config = {
            baseURL: this._url.origin,
            url: "/webapi/DownloadStation/task.cgi",
            params: {
                _sid: this._sid,
                api: "SYNO.DownloadStation.Task",
                version: 1,
                method: "getinfo",
                id: id,
                additional: additional
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        };

        return await axios.request(config)
                            .then((response) => {
                                if (response.status == 200) {
                                    if (response.data.success) {
                                        // console.log(response.data);
                                        return response.data;
                                    }
                                } else {
                                    console.log("Http error code: " + response.status);
                                }
                            })
                            .catch((error) => {
                                console.log(error);
                            });
    }

    /**
     * Download uri of HTTP/FTP/magnet/ED2k.
     * Use login before call
     * @param {string} uri HTTP/FTP/magnet/ED2k link
     * @return {Promise} created task object on resolve
     */
    async createTask(uri) {
        const config = {
            baseURL: this._url.origin,
            url: "/webapi/DownloadStation/task.cgi",
            params: {
                _sid: this._sid,
                api: "SYNO.DownloadStation.Task",
                version: 3,
                method: "create",
                uri: uri
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        };

        return await axios.request(config)
            .then(function(response){
                if (response.status == 200) {
                    // console.log(response.data);
                    return response.data;
                }
            })
            .catch(function(error){
                console.log(error);
            })
    }

    /**
     * Delete specify task by Task ID.
     * @param {string} id Task IDs to be deleted
     * @param {boolean} force_complete Delete tasks and force to move uncompleted download files to the destination
     * @return {Promise}  on resolve
     */
    async deleteTask(id, force_complete = false) {
        const config = {
            baseURL: this._url.origin,
            url: "/webapi/DownloadStation/task.cgi",
            params: {
                _sid: this._sid,
                api: "SYNO.DownloadStation.Task",
                version: 1,
                method: "delete",
                id: id,
                force_complete: force_complete
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        };

        return await axios.request(config)
                            .then(function(response){
                                if (response.status == 200) {
                                    // console.log(response.data);
                                    return response.data;
                                }
                            })
                            .catch(function(error){
                                console.log(error);
                            })
    }
 
    /**
     * Pause the task by Task ID.
     * @param {string} taskId Task ID like "dbid_100"
     * @return {object} on resolve. example: {success: true, data: [{error: 0, id: "dbid_100"}]}
     */
    async pauseTask(taskId) {
        const config = {
            baseURL: this._url.origin,
            url: "/webapi/DownloadStation/task.cgi",
            params: {
                _sid: this._sid,
                api: "SYNO.DownloadStation.Task",
                version: 1,
                method: "pause",
                id: taskId
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        };

        return await axios.request(config)
                            .then(function(response){
                                if (response.status == 200) {
                                    // console.log(response.data);
                                    return response.data;
                                }
                            })
                            .catch(function(error){
                                console.log(error);
                            })
    }
 
    /**
     * Resume the task by Task ID.
     * @param {string} taskId Task ID like "dbid_100"
     * @return {object} on resolve. example: {success: true, data: [{error: 0, id: "dbid_100"}]}
     */
    async resumeTask(taskId) {
        const config = {
            baseURL: this._url.origin,
            url: "/webapi/DownloadStation/task.cgi",
            params: {
                _sid: this._sid,
                api: "SYNO.DownloadStation.Task",
                version: 1,
                method: "resume",
                id: taskId
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        };

        return await axios.request(config)
                            .then(function(response){
                                if (response.status == 200) {
                                    // console.log(response.data);
                                    return response.data;
                                }
                            })
                            .catch(function(error){
                                console.log(error);
                            })
    }

    /**
     * @return {string} hostname with port but without protocol
     */
    get host() {
        return this._url.host;
    }

    /**
     * @return {string} portocol name like http
     */
    get portocol() {
        return this._url.protocol;
    }

    /**
     * @return {string} domain name or ip
     */
    get hostname() {
        return this._url.hostname;
    }

    /**
     * @return {int} port number
     */
    get port() {
        return this._url.port;
    }
}

module.exports = Nas;