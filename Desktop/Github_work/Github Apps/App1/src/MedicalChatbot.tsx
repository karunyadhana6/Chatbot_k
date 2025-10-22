import React, { useState, useRef, useEffect } from 'react';
import { Send, Calendar, Heart, Bell, AlertCircle, CheckCircle, Clock, Shield } from 'lucide-react';

interface Message {
  type: 'bot' | 'user';
  text: string;
  timestamp: Date;
  subType?: string;
}

interface Appointment {
  id: number;
  department: string;
  date: string;
  time: string;
  status: string;
  createdAt: Date;
}

interface Reminder {
  id: number;
  type: string;
  message: string;
  date: string;
  dismissed: boolean;
}

interface SymptomInfo {
  severity: 'emergency' | 'high' | 'moderate' | 'mild';
  relatedSymptoms: string[];
  possibleConditions: string[];
  advice: string;
}

interface SymptomDatabase {
  [key: string]: SymptomInfo;
}

const MedicalChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      type: 'bot', 
      text: 'Hello! I\'m your MediCare Assistant. I\'m here to help you with:\n\n• Booking appointments\n• Checking symptoms\n• Managing reminders\n\nHow can I assist you today? 😊',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [conversationState, setConversationState] = useState<string>('idle');
  const [bookingData, setBookingData] = useState<Partial<Appointment>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Enhanced symptom database with comprehensive medical information
  const symptomDatabase: SymptomDatabase = {
    fever: {
      severity: 'moderate',
      relatedSymptoms: ['chills', 'headache', 'fatigue', 'body aches', 'sweating'],
      possibleConditions: ['viral infection', 'bacterial infection', 'flu', 'covid-19', 'UTI'],
      advice: 'Monitor temperature every 4 hours. Take acetaminophen/ibuprofen as directed. Stay hydrated. Seek care if fever >103°F (39.4°C), persists >3 days, or accompanied by severe symptoms.'
    },
    headache: {
      severity: 'mild',
      relatedSymptoms: ['nausea', 'sensitivity to light', 'dizziness', 'neck stiffness', 'vision changes'],
      possibleConditions: ['tension headache', 'migraine', 'dehydration', 'sinusitis', 'eye strain'],
      advice: 'Rest in quiet, dark room. Apply cold/warm compress. Stay hydrated. Take OTC pain relievers as directed. Seek immediate care for sudden severe headache, neck stiffness, or vision changes.'
    },
    'chest pain': {
      severity: 'emergency',
      relatedSymptoms: ['shortness of breath', 'arm pain', 'jaw pain', 'sweating', 'nausea'],
      possibleConditions: ['heart attack', 'angina', 'pulmonary embolism', 'aortic dissection', 'anxiety'],
      advice: '🚨 CALL 911 IMMEDIATELY. Chew aspirin if not allergic. Do not drive yourself. This could be life-threatening.'
    },
    cough: {
      severity: 'mild',
      relatedSymptoms: ['sore throat', 'congestion', 'fever', 'shortness of breath', 'wheezing'],
      possibleConditions: ['viral upper respiratory infection', 'bronchitis', 'allergies', 'asthma', 'pneumonia'],
      advice: 'Stay hydrated, use humidifier, honey for throat irritation. Seek care if: cough >2 weeks, blood in sputum, difficulty breathing, or high fever.'
    },
    'shortness of breath': {
      severity: 'high',
      relatedSymptoms: ['wheezing', 'chest tightness', 'rapid heartbeat', 'chest pain', 'blue lips'],
      possibleConditions: ['asthma', 'pneumonia', 'heart failure', 'pulmonary embolism', 'anxiety'],
      advice: '⚠️ Requires prompt evaluation. Sit upright, use rescue inhaler if prescribed. Seek immediate care if severe, or accompanied by chest pain/blue coloration.'
    },
    nausea: {
      severity: 'mild',
      relatedSymptoms: ['vomiting', 'diarrhea', 'abdominal pain', 'fever', 'dizziness'],
      possibleConditions: ['gastroenteritis', 'food poisoning', 'pregnancy', 'migraine', 'appendicitis'],
      advice: 'Clear liquids, BRAT diet, rest. Seek care if: severe abdominal pain, blood in vomit/stool, signs of dehydration, or symptoms persist >24 hours.'
    },
    fatigue: {
      severity: 'mild',
      relatedSymptoms: ['weakness', 'difficulty concentrating', 'muscle aches', 'sleep issues', 'mood changes'],
      possibleConditions: ['viral infection', 'anemia', 'thyroid disorders', 'depression', 'sleep disorders'],
      advice: 'Ensure 7-9 hours sleep, balanced nutrition, regular exercise, stress management. Consult doctor if persistent >2 weeks or interfering with daily activities.'
    },
    dizziness: {
      severity: 'moderate',
      relatedSymptoms: ['vertigo', 'nausea', 'balance issues', 'hearing changes', 'headache'],
      possibleConditions: ['benign positional vertigo', 'inner ear infection', 'low blood pressure', 'dehydration', 'medication side effects'],
      advice: 'Sit/lie down immediately, avoid sudden movements, stay hydrated. Seek care if severe, persistent, or with hearing loss/neurological symptoms.'
    },
    'sore throat': {
      severity: 'mild',
      relatedSymptoms: ['difficulty swallowing', 'swollen glands', 'fever', 'hoarse voice', 'cough'],
      possibleConditions: ['viral pharyngitis', 'strep throat', 'allergies', 'acid reflux', 'tonsillitis'],
      advice: 'Warm salt water gargles, throat lozenges, warm liquids, humidifier. See doctor if severe pain, difficulty swallowing, or fever >101°F.'
    },
    'abdominal pain': {
      severity: 'moderate',
      relatedSymptoms: ['nausea', 'vomiting', 'fever', 'diarrhea', 'bloating'],
      possibleConditions: ['gastroenteritis', 'appendicitis', 'gallbladder disease', 'kidney stones', 'IBS'],
      advice: 'Rest, clear liquids, avoid solid foods initially. Seek immediate care for severe pain, fever >101°F, vomiting blood, or signs of appendicitis.'
    },
    'back pain': {
      severity: 'mild',
      relatedSymptoms: ['muscle stiffness', 'leg pain', 'numbness', 'tingling', 'weakness'],
      possibleConditions: ['muscle strain', 'herniated disc', 'arthritis', 'kidney stones', 'sciatica'],
      advice: 'Rest, ice/heat therapy, gentle stretching, OTC pain relievers. Seek care for severe pain, numbness/weakness in legs, or loss of bladder control.'
    },
    'skin rash': {
      severity: 'mild',
      relatedSymptoms: ['itching', 'redness', 'swelling', 'blisters', 'fever'],
      possibleConditions: ['allergic reaction', 'eczema', 'contact dermatitis', 'viral exanthem', 'bacterial infection'],
      advice: 'Avoid known irritants, cool compresses, moisturize gently. Seek immediate care for widespread rash with fever, difficulty breathing, or severe swelling.'
    }
  };

  const availableTimeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'
  ];

  const departments = [
    'General Practice',
    'Cardiology',
    'Dermatology',
    'Orthopedics',
    'Pediatrics',
    'Mental Health'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (type: 'bot' | 'user', text: string, options: Partial<Message> = {}) => {
    setMessages((prev: Message[]) => [...prev, { 
      type, 
      text, 
      timestamp: new Date(),
      ...options
    }]);
  };

  const analyzeSymptoms = (userInput: string): string[] => {
    const lowerInput = userInput.toLowerCase();
    const detectedSymptoms: string[] = [];
    
    // Enhanced symptom detection with synonyms and variations
    const symptomSynonyms: { [key: string]: string[] } = {
      'fever': ['temperature', 'hot', 'burning up', 'feverish', 'pyrexia'],
      'headache': ['head pain', 'migraine', 'head hurts', 'head ache', 'cranial pain'],
      'chest pain': ['chest hurts', 'chest pressure', 'heart pain', 'cardiac pain'],
      'cough': ['coughing', 'hacking', 'phlegm', 'mucus'],
      'shortness of breath': ['breathing problems', 'cant breathe', 'winded', 'breathless', 'dyspnea'],
      'nausea': ['sick to stomach', 'queasy', 'nauseated', 'feel sick'],
      'fatigue': ['tired', 'exhausted', 'worn out', 'sleepy', 'lethargic', 'weakness'],
      'dizziness': ['dizzy', 'lightheaded', 'vertigo', 'spinning', 'unsteady'],
      'sore throat': ['throat pain', 'throat hurts', 'scratchy throat', 'pharyngitis'],
      'abdominal pain': ['stomach pain', 'belly pain', 'stomach hurts', 'stomach ache', 'tummy pain'],
      'back pain': ['back hurts', 'back ache', 'spine pain', 'lower back pain'],
      'skin rash': ['rash', 'skin irritation', 'hives', 'bumps', 'red spots', 'itchy skin']
    };

    // Check for direct symptom matches and synonyms
    Object.keys(symptomDatabase).forEach(symptom => {
      if (lowerInput.includes(symptom)) {
        detectedSymptoms.push(symptom);
      } else if (symptomSynonyms[symptom]) {
        symptomSynonyms[symptom].forEach(synonym => {
          if (lowerInput.includes(synonym) && !detectedSymptoms.includes(symptom)) {
            detectedSymptoms.push(symptom);
          }
        });
      }
    });

    return detectedSymptoms;
  };

  const generateSymptomResponse = (symptoms: string[]): string => {
    if (symptoms.length === 0) {
      return '🩺 I understand you\'re not feeling well. To provide better guidance, could you describe your symptoms in more detail?\n\nFor example:\n• "I have a fever and headache"\n• "My chest hurts when I breathe"\n• "I\'ve been feeling dizzy and nauseous"\n\nI can help analyze symptoms like fever, headache, cough, chest pain, shortness of breath, nausea, fatigue, dizziness, sore throat, abdominal pain, back pain, and skin rashes.';
    }

    let response = '🩺 **SYMPTOM ANALYSIS**\n\nThank you for sharing your symptoms. Here\'s my assessment:\n\n';
    
    // Check for emergency symptoms first
    const emergencySymptoms = symptoms.filter(s => symptomDatabase[s]?.severity === 'emergency');
    
    if (emergencySymptoms.length > 0) {
      response = '🚨 **URGENT MEDICAL ATTENTION NEEDED**\n\n';
      response += '⚠️ Based on your symptoms, this could be a medical emergency!\n\n';
      response += '**IMMEDIATE ACTION REQUIRED:**\n';
      response += '• Call 911 or go to the nearest emergency room NOW\n';
      response += '• Do not drive yourself\n';
      response += '• If experiencing chest pain, chew aspirin (unless allergic)\n\n';
      response += '**Emergency symptoms detected:**\n';
      emergencySymptoms.forEach(symptom => {
        const info = symptomDatabase[symptom];
        response += `• **${symptom.charAt(0).toUpperCase() + symptom.slice(1)}**: ${info.advice}\n`;
      });
      response += '\n⏰ Time is critical. Please seek emergency care immediately.';
      return response;
    }

    // Check for high-severity symptoms
    const highSeveritySymptoms = symptoms.filter(s => symptomDatabase[s]?.severity === 'high');
    if (highSeveritySymptoms.length > 0) {
      response += '⚠️ **HIGH PRIORITY**: Some of your symptoms require prompt medical attention.\n\n';
    }

    // Categorize symptoms by severity
    const symptomsBySeverity = {
      high: symptoms.filter(s => symptomDatabase[s]?.severity === 'high'),
      moderate: symptoms.filter(s => symptomDatabase[s]?.severity === 'moderate'),
      mild: symptoms.filter(s => symptomDatabase[s]?.severity === 'mild')
    };

    // Generate detailed analysis for each symptom
    Object.entries(symptomsBySeverity).forEach(([severity, symptomList]) => {
      if (symptomList.length > 0) {
        const severityEmoji = severity === 'high' ? '🔴' : severity === 'moderate' ? '🟡' : '🟢';
        const severityLabel = severity.toUpperCase();
        
        response += `${severityEmoji} **${severityLabel} SEVERITY SYMPTOMS:**\n`;
        
        symptomList.forEach((symptom, index) => {
          const info = symptomDatabase[symptom];
          response += `\n${index + 1}. **${symptom.charAt(0).toUpperCase() + symptom.slice(1)}**\n`;
          response += `   📋 Possible causes: ${info.possibleConditions.join(', ')}\n`;
          response += `   🏥 Recommendation: ${info.advice}\n`;
          
          // Show related symptoms user should watch for
          if (info.relatedSymptoms.length > 0) {
            response += `   👀 Watch for: ${info.relatedSymptoms.join(', ')}\n`;
          }
        });
        response += '\n';
      }
    });

    // Add symptom combination analysis
    if (symptoms.length > 1) {
      response += '🔗 **SYMPTOM COMBINATION ANALYSIS:**\n';
      response += analyzeSymptomCombinations(symptoms);
      response += '\n';
    }

    // Add general recommendations
    response += '💡 **GENERAL RECOMMENDATIONS:**\n';
    response += '• Monitor your symptoms closely\n';
    response += '• Stay hydrated and get adequate rest\n';
    response += '• Take your temperature if you haven\'t already\n';
    response += '• Keep a symptom diary with times and severity\n';
    
    if (highSeveritySymptoms.length > 0) {
      response += '\n🏥 **SEEK MEDICAL CARE** if symptoms worsen or you develop new concerning symptoms.\n';
    } else {
      response += '\n📞 Consider scheduling an appointment if symptoms persist or worsen.\n';
    }

    response += '\n💙 Would you like me to help you book an appointment with one of our healthcare providers?';

    return response;
  };

  const analyzeSymptomCombinations = (symptoms: string[]): string => {
    let analysis = '';
    
    // Common symptom combinations and their implications
    const combinations = [
      {
        symptoms: ['fever', 'headache', 'fatigue'],
        condition: 'Viral infection (flu-like illness)',
        advice: 'Rest, fluids, monitor temperature. Seek care if fever >103°F or symptoms worsen.'
      },
      {
        symptoms: ['chest pain', 'shortness of breath'],
        condition: 'Potential cardiac or pulmonary emergency',
        advice: 'Seek immediate medical evaluation - this combination requires urgent assessment.'
      },
      {
        symptoms: ['nausea', 'abdominal pain', 'fever'],
        condition: 'Possible gastroenteritis or appendicitis',
        advice: 'Monitor closely. Seek immediate care for severe abdominal pain or persistent vomiting.'
      },
      {
        symptoms: ['headache', 'dizziness', 'nausea'],
        condition: 'Possible migraine or inner ear disorder',
        advice: 'Rest in quiet, dark room. Stay hydrated. Monitor for vision changes or neck stiffness.'
      },
      {
        symptoms: ['cough', 'shortness of breath', 'fever'],
        condition: 'Possible respiratory infection (pneumonia)',
        advice: 'This combination warrants medical evaluation, especially with breathing difficulties.'
      }
    ];

    // Check for matching combinations
    for (const combo of combinations) {
      const matchingSymptoms = combo.symptoms.filter(s => symptoms.includes(s));
      if (matchingSymptoms.length >= 2) {
        analysis += `• **${combo.condition}**: ${combo.advice}\n`;
      }
    }

    if (analysis === '') {
      analysis = '• Your symptoms may be related. Continue monitoring and note any patterns or triggers.\n';
    }

    return analysis;
  };

  const handleBookingFlow = (userInput: string): string | undefined => {
    const lowerInput = userInput.toLowerCase();

    if (conversationState === 'booking_department') {
      const selectedDept = departments.find(d => lowerInput.includes(d.toLowerCase()));
      if (selectedDept) {
        setBookingData((prev: Partial<Appointment>) => ({ ...prev, department: selectedDept }));
        setConversationState('booking_date');
        return `Great choice! ${selectedDept} is an excellent department for your needs.\n\nWhat date would you prefer? You can say something like "tomorrow", "next Monday", or specify a date.`;
      }
      return 'I didn\'t catch which department you\'d like. Please choose from: ' + departments.join(', ');
    }

    if (conversationState === 'booking_date') {
      setBookingData((prev: Partial<Appointment>) => ({ ...prev, date: userInput }));
      setConversationState('booking_time');
      return `Perfect! I have availability on ${userInput}.\n\nPlease select a time slot:\n${availableTimeSlots.map(t => `• ${t}`).join('\n')}`;
    }

    if (conversationState === 'booking_time') {
      const selectedTime = availableTimeSlots.find(t => lowerInput.includes(t.toLowerCase()));
      if (selectedTime) {
        const appointment: Appointment = {
          ...bookingData as Appointment,
          time: selectedTime,
          id: Date.now(),
          status: 'confirmed',
          createdAt: new Date(),
          department: bookingData.department || '',
          date: bookingData.date || ''
        };
        setAppointments((prev: Appointment[]) => [...prev, appointment]);
        
        // Create reminder
        const reminder: Reminder = {
          id: Date.now() + 1,
          type: 'appointment',
          message: `Appointment reminder: ${appointment.department} on ${appointment.date} at ${appointment.time}`,
          date: appointment.date,
          dismissed: false
        };
        setReminders((prev: Reminder[]) => [...prev, reminder]);
        
        setConversationState('idle');
        setBookingData({});
        
        return `✅ Wonderful! Your appointment is confirmed!\n\n📋 Appointment Details:\n• Department: ${appointment.department}\n• Date: ${appointment.date}\n• Time: ${appointment.time}\n\nYou'll receive a reminder before your appointment. Please arrive 15 minutes early and bring your ID and insurance card.\n\nIs there anything else I can help you with?`;
      }
      return 'Please select one of the available time slots: ' + availableTimeSlots.join(', ');
    }
  };

  const handleInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    addMessage('user', input);
    const lowerInput = input.toLowerCase();

    // Handle ongoing booking flow
    if (conversationState.startsWith('booking_')) {
      const response = handleBookingFlow(input);
      if (response) {
        setTimeout(() => addMessage('bot', response), 500);
      }
      setInput('');
      return;
    }

    // Enhanced symptom checking with more trigger words
    if (lowerInput.includes('symptom') || lowerInput.includes('feeling') || 
        lowerInput.includes('sick') || lowerInput.includes('pain') ||
        lowerInput.includes('hurt') || lowerInput.includes('ache') ||
        lowerInput.includes('uncomfortable') || lowerInput.includes('unwell') ||
        lowerInput.includes('not well') || lowerInput.includes('ill') ||
        lowerInput.includes('temperature') || lowerInput.includes('fever') ||
        lowerInput.includes('headache') || lowerInput.includes('cough') ||
        lowerInput.includes('tired') || lowerInput.includes('nausea') ||
        lowerInput.includes('dizzy') || lowerInput.includes('breathing') ||
        lowerInput.includes('chest') || lowerInput.includes('stomach') ||
        lowerInput.includes('throat') || lowerInput.includes('back') ||
        lowerInput.includes('rash') || lowerInput.includes('check symptoms')) {
      
      const symptoms = analyzeSymptoms(input);
      const response = generateSymptomResponse(symptoms);
      setTimeout(() => addMessage('bot', response, { subType: 'symptom-check' }), 500);
      setInput('');
      return;
    }

    // Appointment booking
    if (lowerInput.includes('book') || lowerInput.includes('appointment') || 
        lowerInput.includes('schedule') || lowerInput.includes('see doctor')) {
      setConversationState('booking_department');
      setTimeout(() => {
        addMessage('bot', 
          'I\'d be happy to help you schedule an appointment! 📅\n\nWhich department would you like to visit?\n\n' +
          departments.map(d => `• ${d}`).join('\n') +
          '\n\nPlease let me know your preference.'
        );
      }, 500);
      setInput('');
      return;
    }

    // Check appointments
    if (lowerInput.includes('my appointment') || lowerInput.includes('upcoming')) {
      if (appointments.length === 0) {
        setTimeout(() => addMessage('bot', 'You don\'t have any upcoming appointments scheduled. Would you like to book one?'), 500);
      } else {
        let response = 'Here are your upcoming appointments:\n\n';
        appointments.forEach((apt, idx) => {
          response += `${idx + 1}. ${apt.department}\n   📅 ${apt.date} at ${apt.time}\n   Status: ${apt.status}\n\n`;
        });
        setTimeout(() => addMessage('bot', response), 500);
      }
      setInput('');
      return;
    }

    // Check reminders
    if (lowerInput.includes('reminder')) {
      if (reminders.filter(r => !r.dismissed).length === 0) {
        setTimeout(() => addMessage('bot', 'You don\'t have any active reminders at the moment. I\'ll create reminders automatically when you book appointments or request follow-ups! 🔔'), 500);
      } else {
        let response = 'Here are your active reminders:\n\n';
        reminders.filter(r => !r.dismissed).forEach((rem, idx) => {
          response += `${idx + 1}. ${rem.message}\n   📅 ${rem.date}\n\n`;
        });
        setTimeout(() => addMessage('bot', response), 500);
      }
      setInput('');
      return;
    }

    // Emergency keywords
    if (lowerInput.includes('emergency') || lowerInput.includes('urgent') ||
        lowerInput.includes('severe') || lowerInput.includes('911')) {
      setTimeout(() => addMessage('bot', 
        '🚨 If this is a medical emergency, please call 911 immediately or go to your nearest emergency room.\n\n' +
        'Emergency signs include:\n• Chest pain or pressure\n• Difficulty breathing\n• Severe bleeding\n• Loss of consciousness\n• Stroke symptoms\n\n' +
        'Your safety is paramount. Please seek immediate help if needed. I\'m here for non-emergency support.'
      ), 500);
      setInput('');
      return;
    }

    // Default empathetic response
    setTimeout(() => addMessage('bot', 
      'I\'m here to support you! I can help with:\n\n' +
      '• 🩺 Checking symptoms\n' +
      '• 📅 Booking appointments\n' +
      '• 🔔 Managing reminders\n' +
      '• 📋 Viewing your scheduled visits\n\n' +
      'What would you like assistance with today?'
    ), 500);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* HIPAA Compliance Notice */}
        <div className="bg-blue-900 text-white p-3 rounded-t-2xl flex items-center gap-2 text-sm">
          <Shield className="w-5 h-5" />
          <span>🔒 HIPAA Compliant | Your health information is secure and confidential</span>
        </div>

        <div className="bg-white rounded-b-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-full">
                  <Heart className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">MediCare Assistant</h1>
                  <p className="text-blue-100 text-sm">Your compassionate healthcare companion</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="bg-white bg-opacity-20 backdrop-blur px-3 py-2 rounded-lg text-sm">
                  <Clock className="w-4 h-4 inline mr-1" />
                  24/7 Available
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 p-6">
            {/* Chat Section */}
            <div className="lg:col-span-2 flex flex-col h-[600px]">
              <div className="flex-1 bg-gradient-to-b from-gray-50 to-white rounded-xl p-4 overflow-y-auto mb-4 space-y-4 border border-gray-200">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${
                      msg.type === 'user' 
                        ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm' 
                        : 'bg-white text-gray-800 shadow-lg border border-gray-100 rounded-2xl rounded-bl-sm'
                    } p-4`}>
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                      <div className={`text-xs mt-2 ${msg.type === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleInput(e)}
                  placeholder="Type your message... I'm here to help 💙"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleInput}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setInput('I want to book an appointment')}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  📅 Book Appointment
                </button>
                <button
                  onClick={() => setInput('I have symptoms to check')}
                  className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                >
                  🩺 Check Symptoms
                </button>
                <button
                  onClick={() => setInput('Show my appointments')}
                  className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                >
                  📋 My Appointments
                </button>
                <button
                  onClick={() => setInput('I have chest pain and shortness of breath')}
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  🚨 Emergency Symptoms
                </button>
              </div>

              {/* Symptom Checker Helper */}
              <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                  🩺 Symptom Checker Guide
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  I can analyze these symptoms and provide medical guidance:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span className="text-gray-700">Chest pain</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      <span className="text-gray-700">Shortness of breath</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      <span className="text-gray-700">Fever, Dizziness</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-gray-700">Headache, Cough</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-gray-700">Fatigue, Nausea</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span className="text-gray-700">+ 5 more symptoms</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <span>🔴 Emergency</span>
                  <span>🟠 High</span>
                  <span>🟡 Moderate</span>
                  <span>🟢 Mild</span>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Upcoming Appointments */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 shadow-md border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-gray-800">Upcoming Appointments</h3>
                </div>
                {appointments.length === 0 ? (
                  <p className="text-sm text-gray-600">No appointments scheduled</p>
                ) : (
                  <div className="space-y-3">
                    {appointments.slice(-3).map(apt => (
                      <div key={apt.id} className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 text-sm">{apt.department}</p>
                            <p className="text-xs text-gray-600 mt-1">📅 {apt.date}</p>
                            <p className="text-xs text-gray-600">🕐 {apt.time}</p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Reminders */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 shadow-md border border-amber-200">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-gray-800">Active Reminders</h3>
                </div>
                {reminders.filter(r => !r.dismissed).length === 0 ? (
                  <p className="text-sm text-gray-600">No active reminders</p>
                ) : (
                  <div className="space-y-2">
                    {reminders.filter(r => !r.dismissed).map(rem => (
                      <div key={rem.id} className="bg-white p-3 rounded-lg shadow-sm text-sm border border-amber-100">
                        <p className="text-gray-800">{rem.message}</p>
                        <p className="text-xs text-gray-500 mt-1">📅 {rem.date}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 shadow-md border-2 border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <h3 className="font-bold text-gray-800">Emergency</h3>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  If you're experiencing a medical emergency, please call:
                </p>
                <div className="bg-red-600 text-white font-bold text-center py-3 rounded-lg text-xl">
                  911
                </div>
                <p className="text-xs text-gray-600 mt-3 text-center">
                  For immediate life-threatening situations
                </p>
              </div>

              {/* Privacy Notice */}
              <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <h4 className="font-semibold text-gray-800 text-sm">Your Privacy</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  All conversations are encrypted and HIPAA compliant. Your health information is protected and confidential.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700">
          <strong>⚕️ Medical Disclaimer:</strong> This chatbot provides general health information and support. It does not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns.
        </div>
      </div>
    </div>
  );
};

export default MedicalChatbot;
