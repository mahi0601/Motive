import React, { useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { templatesData, categories } from './templatesData';
import { FiSearch, FiX, FiCheck, FiStar, FiGrid, FiList, FiArrowRight, FiEye, FiEdit3 } from 'react-icons/fi';
import TaskForm from '../components/TaskForm';
import { useNavigate } from 'react-router-dom';

const TemplateBuilder = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [showPreview, setShowPreview] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const filteredTemplates = templatesData.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setShowForm(true);
  };

  const handleCreateFromTemplate = (formData) => {
    if (!selectedTemplate) return;
    const tasks = selectedTemplate.preview.tasks.map((taskTitle, index) => ({
      id: Date.now() + index,
      title: taskTitle,
      description: formData.description || formData.notes || '',
      category: selectedTemplate.category,
      priority: formData.priority || 'Medium',
      dueDate: formData.dueDate || '',
      tags: selectedTemplate.category ? [selectedTemplate.category.toLowerCase()] : [],
      status: 'todo'
    }));

    const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const updatedTasks = [...existingTasks, ...tasks];
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    
    setShowForm(false);
    setSelectedTemplate(null);
    navigate('/dashboard');
  };

  const TemplateCard = ({ template, index, viewMode = 'grid' }) => {
    if (viewMode === 'list') {
      return (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ x: 4 }}
          className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg hover:ring-2 hover:ring-indigo-500 transition-all duration-300"
        >
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${template.preview.color} flex items-center justify-center flex-shrink-0`}>
              <template.icon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {template.title}
                </h3>
                {template.popular && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <FiStar className="w-3 h-3" />
                    Popular
                  </span>
                )}
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
                  {template.category}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <FiGrid className="w-3 h-3" />
                  {template.fields.length} fields
                </span>
                <span>{template.preview.tasks.length} sample tasks</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowPreview(true);
                }}
                className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors"
                title="Preview"
              >
                <FiEye className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleUseTemplate(template)}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                Use Template
                <FiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.02, y: -4 }}
        className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-md hover:shadow-xl hover:ring-2 hover:ring-indigo-500 transition-all duration-300"
      >
      {template.popular && (
        <div className="absolute top-3 right-3 z-10">
          <div className="px-2 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
            <FiStar className="w-3 h-3" />
            Popular
          </div>
        </div>
      )}

      <div className={`h-32 bg-gradient-to-br ${template.preview.color} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-4 left-4 right-4">
          <template.icon className="w-12 h-12 text-white opacity-90" />
        </div>
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
            {template.category}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {template.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {template.description}
        </p>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {template.preview.tasks.slice(0, 3).map((task, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-md"
            >
              {task}
            </span>
          ))}
          {template.preview.tasks.length > 3 && (
            <span className="text-xs text-gray-500">+{template.preview.tasks.length - 3} more</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <FiGrid className="w-4 h-4" />
            {template.fields.length} fields
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedTemplate(template);
                setShowPreview(true);
              }}
              className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors"
              title="Preview"
            >
              <FiEye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleUseTemplate(template)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              Use Template
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
    );
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f9f9f9] dark:bg-[#0d0d0d] px-6 py-10 font-[Inter]">
        <div className="max-w-7xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
          >
            <div>
              <h2 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-2 flex items-center gap-3 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300">
                <FiGrid className="text-indigo-500" /> Task Templates
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose from pre-built templates or create custom task structures
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <FiGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <FiList className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">Total Templates</p>
                  <p className="text-3xl font-bold">{templatesData.length}</p>
                </div>
                <FiGrid className="w-12 h-12 text-white/50" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Popular Templates</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">
                    {templatesData.filter(t => t.popular).length}
                  </p>
                </div>
                <FiStar className="w-12 h-12 text-indigo-500" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Categories</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">
                    {categories.length - 1}
                  </p>
                </div>
                <FiList className="w-12 h-12 text-purple-500" />
              </div>
            </motion.div>
          </div>

          {templatesData.filter(t => t.popular).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FiStar className="text-indigo-500" />
                Featured Templates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {templatesData.filter(t => t.popular).map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleUseTemplate(template)}
                    className={`relative cursor-pointer bg-gradient-to-br ${template.preview.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}
                  >
                    <div className="absolute top-2 right-2">
                      <FiStar className="w-5 h-5 text-yellow-300" />
                    </div>
                    <template.icon className="w-10 h-10 mb-3 opacity-90" />
                    <h4 className="font-bold text-lg mb-1">{template.title}</h4>
                    <p className="text-white/80 text-xs line-clamp-2">{template.description}</p>
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <span className="text-xs text-white/70">{template.preview.tasks.length} sample tasks</span>
                    </div>
          </motion.div>
        ))}
      </div>
            </motion.div>
          )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-500'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>

          {filteredTemplates.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {filteredTemplates.map((template, index) => (
                <TemplateCard key={template.id} template={template} index={index} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <FiGrid className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">No templates found</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
            </motion.div>
          )}

          <AnimatePresence>
            {showPreview && selectedTemplate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowPreview(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={`h-48 bg-gradient-to-br ${selectedTemplate.preview.color} relative`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <selectedTemplate.icon className="w-16 h-16 text-white mb-4" />
                      <h3 className="text-3xl font-bold text-white mb-2">{selectedTemplate.title}</h3>
                      <p className="text-white/90">{selectedTemplate.description}</p>
                    </div>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-colors"
                    >
                      <FiX className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Template Fields</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedTemplate.fields.map((field, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <FiCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{field}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Sample Tasks</h4>
                      <div className="space-y-2">
                        {selectedTemplate.preview.tasks.map((task, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center gap-3"
                          >
                            <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{task}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowPreview(false);
                        handleUseTemplate(selectedTemplate);
                      }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <FiEdit3 className="w-5 h-5" />
                      Use This Template
            </button>
                  </div>
                </motion.div>
        </motion.div>
      )}
          </AnimatePresence>

          {showForm && selectedTemplate && (
            <TaskForm
              onSubmit={handleCreateFromTemplate}
              onClose={() => {
                setShowForm(false);
                setSelectedTemplate(null);
              }}
              initialData={{
                category: selectedTemplate.category,
                tags: [selectedTemplate.category.toLowerCase()]
              }}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TemplateBuilder;
