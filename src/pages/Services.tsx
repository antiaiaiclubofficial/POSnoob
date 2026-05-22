"use client";

import React from 'react';
import { useStore } from '@/store/useStore';

const Services = () => {
  const { services, currency } = useStore();
  return (
    <div>{/* Services UI */}</div>
  );
};

export default Services; // Fixed TS1192