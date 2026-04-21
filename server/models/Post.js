const mongoose = require('mongoose');

// #region agent log
fetch('http://127.0.0.1:7501/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'34cdf5'},body:JSON.stringify({sessionId:'34cdf5',runId:'pre-fix-boot',hypothesisId:'H1_post_model_mongoose_missing',location:'server/models/Post.js:module_init',message:'Post model module init',data:{mongooseType:typeof mongoose,hasSchema:Boolean(mongoose?.Schema)},timestamp:Date.now()})}).catch(()=>{});
// #endregion

let postSchema;
try {
  postSchema = new mongoose.Schema(
    {
      text: { type: String, required: true, trim: true, maxlength: 2000 },
      caption: { type: String, trim: true, maxlength: 2000, default: '' },
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      imageUrl: { type: String, trim: true, default: '' },
      image: { type: String, trim: true, default: '' },
    },
    { timestamps: true }
  );
  // #region agent log
  fetch('http://127.0.0.1:7501/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'34cdf5'},body:JSON.stringify({sessionId:'34cdf5',runId:'pre-fix-boot',hypothesisId:'H2_post_model_not_exported',location:'server/models/Post.js:schema_created',message:'Post schema created',data:{schemaPaths:Object.keys(postSchema.paths||{}).length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
} catch (err) {
  // #region agent log
  fetch('http://127.0.0.1:7501/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'34cdf5'},body:JSON.stringify({sessionId:'34cdf5',runId:'pre-fix-boot',hypothesisId:'H1_post_model_mongoose_missing',location:'server/models/Post.js:schema_create_error',message:'Post schema creation failed',data:{errorName:err?.name||null,errorMessage:err?.message||null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  throw err;
}

module.exports = mongoose.model('Post', postSchema);
