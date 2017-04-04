/**
 * Created by Tauseef Naqvi on 27-02-2017.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EbookSchema = new Schema({
    title: {type: String},
    description: {type: String},
    path: {type: String, required: true},
    cover_path: {type: String, required: true},
    tag: [{type: String}]
});
EbookSchema.index({title: 'text', description: 'text', tag: 'text'});
module.exports = mongoose.model('Ebook', EbookSchema);