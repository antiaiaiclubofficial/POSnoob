import React, { useState } from 'react';
import { useStore, Pet, QueueItem } from '@/store/useStore';
import GroomingServiceModal from './GroomingServiceModal';

interface PetProfileRecordProps {
  pet: Pet;
  onEdit: (pet: Pet) => void;
}

const PetProfileRecord = ({ pet, onEdit }: PetProfileRecordProps) => {
  const [selectedIntake, setSelectedIntake] = useState<any>(null); // Added state

  const mockItem: QueueItem = {
    id: selectedIntake?.queueItemId || '',
    customerId: '',
    customerName: '',
    petId: pet.id,
    petName: pet.name,
    serviceId: '',
    serviceName: 'Past Service',
    date: selectedIntake?.date || '',
    time: 'Recorded',
    startTime: '',
    duration: 60,
    totalAmount: 0,
    status: 'Completed',
    isPaid: true
  };

  return (
    <div>
       {/* ... existing UI ... */}
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