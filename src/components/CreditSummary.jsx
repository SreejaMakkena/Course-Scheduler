import React from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';

const CreditSummary = () => {
  const { user } = useAuth();
  
  const currentCredits = apiService.getStudentCredits(user?.id || 0);
  const maxCredits = parseInt(localStorage.getItem('globalCreditLimit')) || 18;
  const remainingCredits = maxCredits - currentCredits;
  const utilizationPercentage = (currentCredits / maxCredits) * 100;
  
  const getStatusColor = () => {
    if (currentCredits > maxCredits) return 'text-red-600';
    if (currentCredits === maxCredits) return 'text-green-600';
    return 'text-blue-600';
  };
  
  const getStatusIcon = () => {
    if (currentCredits > maxCredits) return <AlertTriangle className="h-5 w-5 text-red-600" />;
    if (currentCredits === maxCredits) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <BookOpen className="h-5 w-5 text-blue-600" />;
  };
  
  const minCredits = parseInt(localStorage.getItem('minCreditLimit')) || 12;
  
  const getStatusMessage = () => {
    if (currentCredits > maxCredits) return 'Over credit limit';
    if (currentCredits < minCredits) return `Need ${minCredits - currentCredits} more credits (min ${minCredits})`;
    return `${maxCredits - currentCredits} credits available`;
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Credit Summary
        </h3>
        {getStatusIcon()}
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Current Credits:</span>
          <span className="font-semibold text-gray-900">{currentCredits}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Credit Limit:</span>
          <span className="font-semibold text-gray-900">{maxCredits}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`font-semibold ${getStatusColor()}`}>
            {getStatusMessage()}
          </span>
        </div>
        
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{utilizationPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                currentCredits > maxCredits 
                  ? 'bg-red-600' 
                  : currentCredits === maxCredits 
                  ? 'bg-green-600' 
                  : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
        
        {currentCredits > maxCredits && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> You are {currentCredits - maxCredits} credits over your limit. 
              Consider dropping some courses or contact your advisor.
            </p>
          </div>
        )}
        
        {currentCredits >= minCredits && currentCredits <= maxCredits && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-800">
              Valid registration! You can add up to {maxCredits - currentCredits} more credits.
            </p>
          </div>
        )}
        
        {currentCredits < minCredits && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
            <p className="text-sm text-orange-800">
              Minimum {minCredits} credits required. You need {minCredits - currentCredits} more credits.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditSummary;