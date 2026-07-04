import { AppointmentService } from '../../services/appointmentService.ts';
import type { GraphState } from '../graph.ts';
import { z } from 'zod';

const CancelRequiredFieldsSchema = z.object({
  professionalId: z.number({ error: 'Professional ID is required' }),
  datetime: z.string({ error: 'Appointment datetime is required' }),
  patientName: z.string({ error: 'Patient name is required' }),
})

export function createCancellerNode(appointmentService: AppointmentService) {
  return async (state: GraphState): Promise<GraphState> => {
    console.log(`❌ Cancelling appointment...`);

    try {
      const validation = CancelRequiredFieldsSchema.safeParse(state);

      if (validation.error) {
        const errorMessages = validation.error.issues.map(e => e.message).join(', ');
        console.error(`Validation failed: ${errorMessages}`);
  
        return {
          ...state,
          actionSuccess: false,
          actionError: errorMessages,
        };
      }

      appointmentService.cancelAppointment(
        validation.data.professionalId,
        validation.data.patientName,
        new Date(validation.data.datetime)
      )

      return {
        ...state,
        actionSuccess: true,
      };
    } catch (error) {
      console.log(`❌ Cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        ...state,
        actionSuccess: false,
        actionError: error instanceof Error ? error.message : 'Cancellation failed',
      };
    }
  };
}
