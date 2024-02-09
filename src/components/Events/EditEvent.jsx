import { Link, redirect, useNavigate, useParams } from 'react-router-dom';

import Modal from '../UI/Modal.jsx';
import EventForm from './EventForm.jsx';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchEvent, queryClient, updateEvent } from '../../util/http.js';
import ErrorBlock from '../UI/ErrorBlock.jsx';

export default function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();

  //for action approach
  //const submit = useSubmit()

  //since we also use loader we can useLoaderData but its better to use useQuery as when loader is
  //execcuted useQuery will cache the data and when we execute useQuery again it will be faster
  const { data, isError, error } = useQuery({
    queryKey: ['events', id],
    queryFn: ({ signal }) => fetchEvent({ signal, id }),
    //to avoid redundant http request
    staleTime: 10000
  });

  const { mutate } = useMutation({
    mutationFn: updateEvent,
    //performing optimistic update, and if error occurs we rollback the update
    //tanstack automaticaly passes the data that we passed to mutate fn to onMutate
    onMutate: async (data)=> {
      const newEvent = data.event;
      //to cancel all ongoing quries to perform optimistic updating
      await queryClient.cancelQueries({queryKey: ['events', id]});
      const previousEvent = queryClient.getQueryData({queryKey: ['events', id]});
      queryClient.setQueryData(['events', id], newEvent);

      return {previousEvent};
    },
    //these params are automatically passed by tanstack
    //the object we return from onMutate will be available as context in onError
    onError: (error, data, context)=> {
      queryClient.setQueryData(["events", id], context.previousEvent);
    },
    //called whenver mutation is done (fail or success)
    onSettled: ()=> {
      queryClient.invalidateQueries({queryKey: ['events', id]});
    }
  })

  function handleSubmit(formData) {
      mutate({id, event: formData});
      navigate('../');
      //action aproach
      /*
        submit(formData, {method: "PUT"})
      */
  }

  function handleClose() {
    navigate('../');
  }

  let content;


  if (isError) {
    content = <>
      <ErrorBlock title={"Failed to load event"} message={"There was some error in fetching event"} />
      <Link className='button' to={"../"}>
        Okay
      </Link>
    </>
  }

  if (data) {
    content = (
      <EventForm inputData={data} onSubmit={handleSubmit}>
        <Link to="../" className="button-text">
          Cancel
        </Link>
        <button type="submit" className="button">
          Update
        </button>
      </EventForm>
    )
  }

  return (
    <Modal onClose={handleClose}>
      {content}
    </Modal>
  );
}

//combining tanstack and react router features
export function loader({params}) {
  //function that allows to execute the query programatically 
  return queryClient.fetchQuery({
    queryKey: ['events', params.id],
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id })
  })
}

//alternate approach to mutation, in action method we donot perform optimistic updation
//action is triggered whenever we submit a form on that route
export async function action({request, params}) {
  const formData = await request.formData();
  const updatedEventData = Object.fromEntries(formData);
  await updateEvent({id: params.id, event: updatedEventData});
  await queryClient.invalidateQueries(['event']);
  return redirect('../');
}
