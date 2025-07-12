import React, { useState } from 'react';
import { Settings, Save, Plus, Edit, Trash2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const FeeConfiguration: React.FC = () => {
  const { feeConfig, updateFeeConfig } = useData();
  const [developmentFees, setDevelopmentFees] = useState(feeConfig.developmentFees);
  const [busStops, setBusStops] = useState(feeConfig.busStops);
  const [newStopName, setNewStopName] = useState('');
  const [newStopAmount, setNewStopAmount] = useState('');
  const [editingStop, setEditingStop] = useState<string | null>(null);

  const handleDevelopmentFeeChange = (classNum: string, amount: string) => {
    setDevelopmentFees(prev => ({
      ...prev,
      [classNum]: parseInt(amount) || 0
    }));
  };

  const handleSaveDevelopmentFees = () => {
    updateFeeConfig({ developmentFees });
    alert('Development fees updated successfully!');
  };

  const handleAddBusStop = () => {
    if (newStopName && newStopAmount) {
      setBusStops(prev => ({
        ...prev,
        [newStopName]: parseInt(newStopAmount)
      }));
      setNewStopName('');
      setNewStopAmount('');
    }
  };

  const handleUpdateBusStop = (stopName: string, amount: string) => {
    setBusStops(prev => ({
      ...prev,
      [stopName]: parseInt(amount) || 0
    }));
  };

  const handleDeleteBusStop = (stopName: string) => {
    if (confirm(`Are you sure you want to delete bus stop "${stopName}"?`)) {
      const newBusStops = { ...busStops };
      delete newBusStops[stopName];
      setBusStops(newBusStops);
    }
  };

  const handleSaveBusStops = () => {
    updateFeeConfig({ busStops });
    alert('Bus stops updated successfully!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fee Configuration</h1>
        <p className="text-gray-600">Manage development fees and bus stop charges</p>
      </div>

      {/* Development Fees */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Development Fees by Class</h2>
            <p className="text-sm text-gray-600">Set development fee amounts for each class</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(classNum => (
            <div key={classNum} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Class {classNum}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={developmentFees[classNum.toString()] || ''}
                  onChange={(e) => handleDevelopmentFeeChange(classNum.toString(), e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveDevelopmentFees}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save className="h-4 w-4" />
          <span>Save Development Fees</span>
        </button>
      </div>

      {/* Bus Stops */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Settings className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bus Stop Configuration</h2>
              <p className="text-sm text-gray-600">Manage bus stops and their fee amounts</p>
            </div>
          </div>
        </div>

        {/* Add New Bus Stop */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Bus Stop</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Bus stop name"
              value={newStopName}
              onChange={(e) => setNewStopName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                placeholder="Amount"
                value={newStopAmount}
                onChange={(e) => setNewStopAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleAddBusStop}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Stop</span>
            </button>
          </div>
        </div>

        {/* Existing Bus Stops */}
        <div className="space-y-3 mb-6">
          {Object.entries(busStops).map(([stopName, amount]) => (
            <div key={stopName} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <span className="font-medium text-gray-900">{stopName}</span>
              </div>
              <div className="flex items-center space-x-3">
                {editingStop === stopName ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => handleUpdateBusStop(stopName, e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onBlur={() => setEditingStop(null)}
                      onKeyPress={(e) => e.key === 'Enter' && setEditingStop(null)}
                      autoFocus
                    />
                  </div>
                ) : (
                  <span className="font-semibold text-green-600">₹{amount}</span>
                )}
                <div className="flex space-x-1">
                  <button
                    onClick={() => setEditingStop(stopName)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBusStop(stopName)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveBusStops}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Save className="h-4 w-4" />
          <span>Save Bus Stop Configuration</span>
        </button>
      </div>

      {/* Current Configuration Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Configuration Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Development Fees Range</h4>
            <p className="text-sm text-gray-600">
              ₹{Math.min(...Object.values(developmentFees))} - ₹{Math.max(...Object.values(developmentFees))}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Bus Stops Configured</h4>
            <p className="text-sm text-gray-600">
              {Object.keys(busStops).length} stops (₹{Math.min(...Object.values(busStops))} - ₹{Math.max(...Object.values(busStops))})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeConfiguration;