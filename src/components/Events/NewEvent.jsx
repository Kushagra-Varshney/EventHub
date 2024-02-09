import { Link, useNavigate } from 'react-router-dom';

import Modal from '../UI/Modal.jsx';
import EventForm from './EventForm.jsx';
import { useMutation } from '@tanstack/react-query';
import { createNewEvent, queryClient } from '../../util/http.js';
import ErrorBlock from '../UI/ErrorBlock.jsx';

export default function NewEvent() {
  const navigate = useNavigate();

  //we can send post request using useQuery but useMutation is better optimized for such requests
  //unlike usequery useMutation doesnt send the request right away when component is rendered 
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: createNewEvent,
    onSuccess: ()=> {
      //when we navigate back to events we donot see the newly added event unless we switch taps or 
      //retrigger useQuery, hence we want to make the previous data as stale and refetch data in events section
      //we use queryClient to achieve this which we can import 
      //invalidateQueries takes an object which we can configure to target specific queries
      queryClient.invalidateQueries({queryKey: ['events']});
      navigate('/events');
    }
  });

  function handleSubmit(formData) {
    mutate({ event: formData });
    //we donot use navigate here as we would always go to events irrespective if error occurred or not
    //hence we use onSuccess in configuration of useMutation hook
    //navigate('/events');
  }

  return (
    <Modal onClose={() => navigate('../')}>
      <EventForm onSubmit={handleSubmit}>
        {isPending && 'Submitting...'}
        {!isPending &&
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Create
            </button>
          </>
        }
      </EventForm>
      {isError && <ErrorBlock title={"Failed to create event"} message={error.info?.message || "Failed to create event. Please check your inputs and try again"} />}
    </Modal>
  );
}
