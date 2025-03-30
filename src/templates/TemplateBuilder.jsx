// TemplateBuilder.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { templatesData } from './templatesData';

const TemplateBuilder = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});

  const handleSelect = (template) => {
    setSelectedTemplate(template);
    const defaultData = {};
    template.fields.forEach(field => {
      defaultData[field] = '';
    });
    setFormData(defaultData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      className="min-h-screen px-6 py-12 bg-[#f9f9f9] dark:bg-[#0d0d0d] text-gray-800 dark:text-white font-inter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold mb-8 text-center">🎨 Choose a Template</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {templatesData.map((template) => (
          <motion.div
            key={template.id}
            whileHover={{ scale: 1.03 }}
            onClick={() => handleSelect(template)}
            className={`cursor-pointer border rounded-xl p-5 transition-all duration-300 shadow-md hover:shadow-xl ${
              selectedTemplate?.id === template.id
                ? 'border-indigo-500 ring-1 ring-indigo-500'
                : 'border-gray-200 dark:border-gray-700'
            } bg-white dark:bg-gray-800`}
          >
            <template.icon className="text-indigo-500 mb-3 text-xl" />
            <h3 className="text-lg font-semibold">{template.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
          </motion.div>
        ))}
      </div>

      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-2xl mx-auto"
        >
          <h3 className="text-xl font-bold mb-4 text-indigo-500">{selectedTemplate.title}</h3>
          <form className="space-y-4">
            {selectedTemplate.fields.map((field) => (
              <div key={field}>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{field}</label>
                <input
                  type="text"
                  placeholder={`Enter ${field}`}
                  value={formData[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className="w-full px-4 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
            <button
              type="submit"
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm transition-all shadow"
            >
              Save Template
            </button>
          </form>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TemplateBuilder;
