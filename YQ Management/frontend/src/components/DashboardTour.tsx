import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export function DashboardTour() {
  useEffect(() => {
    // Only show the tour once per user session or device
    const hasSeenTour = localStorage.getItem('yq_has_seen_tour');
    
    if (!hasSeenTour) {
      const tour = driver({
        showProgress: true,
        steps: [
          {
            element: '#tour-queues-nav',
            popover: {
              title: 'Manage Your Queues',
              description: 'This is where you can see all your active queues and create new ones.',
              side: 'right',
              align: 'start'
            }
          },
          {
            element: '#tour-create-queue-btn',
            popover: {
              title: 'Create a Queue',
              description: 'Click here to create a new queue. You can select pre-built templates for your specific business type!',
              side: 'bottom',
              align: 'start'
            }
          },
          {
            element: '#tour-settings-nav',
            popover: {
              title: 'Connect WhatsApp',
              description: 'Don\'t forget to connect your WhatsApp in the settings so your customers get real-time SMS updates.',
              side: 'right',
              align: 'start'
            }
          }
        ],
        onDestroyStarted: () => {
          if (!tour.hasNextStep() || confirm('Are you sure you want to skip the tour?')) {
            tour.destroy();
            localStorage.setItem('yq_has_seen_tour', 'true');
          }
        }
      });
      
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        tour.drive();
      }, 500);
    }
  }, []);

  return null; // This is a headless component
}
