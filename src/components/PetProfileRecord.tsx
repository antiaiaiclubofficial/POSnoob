"use client";

import React, { useState } from 'react';
// ... other imports
import { useStore, Pet, QueueItem } from '@/store/useStore';
import GroomingServiceModal from './GroomingServiceModal';

const PetProfileRecord = ({ pet, onEdit }: PetProfileRecordProps) => {
  // ... rest of logic
  
  const mockItem: QueueItem = {
    id: selectedIntake?.queueItemId || '',
    petId: pet.id,
    petName: pet.name,
    ownerName: 'Customer',
    customerId: '',
    customerName: 'Customer',
    serviceId: '',
    serviceName: 'Past Service',
    date: selectedIntake?.date || '',
    time: 'Recorded',
    status: 'Completed',
    image: pet.image,
    isPaid: true
  };

  return (
    <div>
      {/* ... previous content ... */}
      {selectedIntake && (
        <GroomingServiceModal 
          item={mockItem} 
          intakeData={selectedIntake}
          readOnly={true}
          onClose={() => setSelectedIntake(null)} 
        />
      )}
    </div>
  );
};

export default PetProfileRecord;