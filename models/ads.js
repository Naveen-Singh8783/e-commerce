const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const adsSchema = new Schema({ 

      userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
      },


      productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          require: true
        },

        posterUrl: {
          type: String,
          required: true
        },

        bid: {
           type: Number,
            require: true
          }

});


module.exports = mongoose.model('ads', adsSchema);
