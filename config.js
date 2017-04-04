/**
 * Created by Tauseef Naqvi on 27-02-2017.
 */
var config = {
    'port': process.env.port || 8080,                           // set ourport
    'database': 'mongodb://127.0.0.1:27017/ebook-data',          // database connection link
    'superSecretCustomer': 'Secret',                             // key for generating for customer api token
    'superSecretAdmin': 'Secret',
    'GoogleApiKey': 'Key',
    'transactionKey': 'Key',
    'vendorKey': 'Key'

};
module.exports = config;