
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Platform, SocialPost, PostType } from '../types';
import { PLATFORM_OPTIONS, PLATFORM_COLORS, BRAND_OPTIONS, POST_TYPES } from '../constants';
import { Save, XCircle, Info, AtSign, Code, Image as ImageIcon, Link as LinkIcon, UploadCloud, FileText, List, Layers } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AddPostFormProps {
  onSave: (post: SocialPost) => void;
  onCancel: () => void;
  initialData?: SocialPost;
}

export const AddPostForm: React.FC<AddPostFormProps> = ({ onSave, onCancel, initialData }) => {
  // Determine initial input type based on data or default
  const [inputType, setInputType] = useState<'embed' | 'screenshot'>(
    initialData?.mediaType || 'embed'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get default values
  const defaultBrand = Object.keys(BRAND_OPTIONS)[0];
  const defaultCurrency = BRAND_OPTIONS[defaultBrand][0];

  const [formData, setFormData] = useState({
    platform: initialData?.platform || PLATFORM_OPTIONS[0] as Platform,
    brandName: initialData?.brandName || defaultBrand,
    accountName: initialData?.accountName || '',
    currency: initialData?.currency || defaultCurrency,
    creatorName: initialData?.creatorName || '',
    postedBy: initialData?.postedBy || '',
    remarks: initialData?.remarks || '',
    content: initialData?.content || '',
    redirectLink: initialData?.redirectLink || '',
    screenshot: initialData?.screenshot || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    category: initialData?.category || '',
    postType: initialData?.postType || POST_TYPES[0] as PostType
  });

  // Validation check for content fields
  const isContentValid = useMemo(() => {
    if (inputType === 'embed') {
      return formData.content.trim().length > 0;
    } else {
      return formData.screenshot.length > 0 && formData.redirectLink.trim().length > 0;
    }
  }, [inputType, formData.content, formData.screenshot, formData.redirectLink]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'brandName') {
      // When brand changes, reset currency to the first available option for that brand
      const newCurrencies = BRAND_OPTIONS[value];
      setFormData(prev => ({ 
        ...prev, 
        brandName: value,
        currency: newCurrencies ? newCurrencies[0] : '' 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, screenshot: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isContentValid) return;

    const post: SocialPost = {
      id: initialData?.id || uuidv4(), // Use existing ID if editing
      platform: formData.platform,
      brandName: formData.brandName,
      accountName: formData.accountName,
      currency: formData.currency,
      creatorName: formData.creatorName,
      postedBy: formData.postedBy,
      remarks: formData.remarks,
      date: formData.date,
      createdAt: initialData?.createdAt || Date.now(), // Preserve original creation time
      // Conditional fields
      mediaType: inputType,
      content: inputType === 'embed' ? formData.content : '',
      screenshot: inputType === 'screenshot' ? formData.screenshot : undefined,
      redirectLink: inputType === 'screenshot' ? formData.redirectLink : undefined,
      // New Fields
      category: formData.category,
      postType: formData.postType as PostType
    };
    onSave(post);
  };

  const currentPlatformColor = PLATFORM_COLORS[formData.platform];
  const currencyOptions = BRAND_OPTIONS[formData.brandName] || [];

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
      <div className="bg-gray-50 px-8 py-6 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">{initialData ? 'Edit Post' : 'Create New Post'}</h2>
        <p className="text-gray-500 text-sm mt-1">{initialData ? 'Update details for this scheduled post.' : 'Schedule a new social media post for the calendar.'}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        
        {/* Row 1: Platform & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Platform</label>
            <div className="relative">
              <select
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-white text-gray-900"
              >
                {PLATFORM_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div 
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                style={{ backgroundColor: currentPlatformColor }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Scheduled Date</label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Row 2: Identity (Brand & Currency) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Brand Name</label>
            <select
              name="brandName"
              value={formData.brandName}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white text-gray-900"
            >
              {Object.keys(BRAND_OPTIONS).map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Currency</label>
             <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white text-gray-900"
              >
                {currencyOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
          </div>
        </div>

        {/* Row 3: Account & Creator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Account Name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <AtSign size={16} />
              </span>
              <input
                type="text"
                name="accountName"
                required
                placeholder="username"
                value={formData.accountName}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Creator Name</label>
            <input
              type="text"
              name="creatorName"
              required
              placeholder="Internal team member"
              value={formData.creatorName}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Row 4: Category & Post Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
           <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Post Category</label>
            <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <List size={16} />
              </span>
              <input
                type="text"
                name="category"
                placeholder="e.g. Promotion, Announcement"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

           <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Post Type</label>
            <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Layers size={16} />
              </span>
              <select
                name="postType"
                value={formData.postType}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white text-gray-900"
              >
                {POST_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Row 5: Posted By & Remarks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Posted By</label>
            <input
              type="text"
              name="postedBy"
              required
              placeholder="Who published it?"
              value={formData.postedBy}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900 placeholder-gray-400"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Remarks / Notes</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FileText size={16} />
              </span>
              <input
                type="text"
                name="remarks"
                placeholder="Add remarks..."
                value={formData.remarks}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Content Type Toggle */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Post Content</label>
          <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setInputType('embed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                inputType === 'embed' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Code size={16} /> Embed Code / Link
            </button>
            <button
              type="button"
              onClick={() => setInputType('screenshot')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                inputType === 'screenshot' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ImageIcon size={16} /> Screenshot & Link
            </button>
          </div>

          {/* Condition 1: Standard Embed Mode */}
          {inputType === 'embed' && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                 <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Embed Code or URL</label>
                 <div className="group relative flex items-center text-xs text-gray-400 hover:text-gray-600 cursor-help">
                    <Info size={14} className="mr-1"/> Help
                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-800 text-white p-3 rounded shadow-lg text-xs hidden group-hover:block z-20">
                      Paste the full &lt;iframe&gt; code for YouTube/Facebook, or a direct link for WhatsApp/IMO.
                    </div>
                 </div>
              </div>
              <textarea
                name="content"
                rows={5}
                placeholder="<iframe...> or https://..."
                value={formData.content}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
          )}

          {/* Condition 2: Screenshot Mode */}
          {inputType === 'screenshot' && (
            <div className="space-y-6 animate-fade-in bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Post Link (Required)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <LinkIcon size={16} />
                  </span>
                  <input 
                    type="url"
                    name="redirectLink"
                    placeholder="https://..."
                    value={formData.redirectLink}
                    onChange={handleChange}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Upload Screenshot</label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors cursor-pointer bg-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  
                  {formData.screenshot ? (
                    <div className="relative w-full h-48">
                      <img 
                        src={formData.screenshot} 
                        alt="Preview" 
                        className="w-full h-full object-contain rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium rounded-lg">
                        Change Image
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <UploadCloud size={32} className="mb-2 text-gray-400"/>
                      <span className="text-sm font-medium text-indigo-600">Click to upload</span>
                      <span className="text-xs mt-1">SVG, PNG, JPG or GIF</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <XCircle size={18} /> Cancel
          </button>
          <button
            type="submit"
            disabled={!isContentValid}
            className={`px-6 py-2.5 rounded-lg text-white font-medium shadow-md flex items-center gap-2 transition-all ${
              isContentValid 
                ? 'bg-indigo-600 hover:bg-indigo-700' 
                : 'bg-gray-300 cursor-not-allowed opacity-70'
            }`}
          >
            <Save size={18} /> {initialData ? 'Update Post' : 'Save Post'}
          </button>
        </div>
      </form>
    </div>
  );
};
