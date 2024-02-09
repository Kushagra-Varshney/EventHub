import { useEffect, useState } from 'react';

import LoadingIndicator from '../UI/LoadingIndicator.jsx';
import ErrorBlock from '../UI/ErrorBlock.jsx';
import EventItem from './EventItem.jsx';
import { useQuery } from '@tanstack/react-query';
import { fetchEvents } from '../../util/http.js';

export default function NewEventsSection() {

  //for isError to be true our query fn must throw error in ccase any error occurs
  //data is the value returned by the query fn
  //isPending is for that current status iof request
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['events', { max: 3 }],
    //sincce we also get the queryKey that is responsible for triggering event 
    //we can use that to set our max value
    queryFn: ({ signal, queryKey }) => fetchEvents({ signal, ...queryKey[1] }),
    staleTime: 5000,
    // staleTime: for deciding after how many ms should the request be resent 
    //gcTime: garbage collection time - after how much should cached data be removed - default - 5 mins
  });

  let content;

  if (isPending) {
    content = <LoadingIndicator />;
  }

  if (isError) {
    content = (
      <ErrorBlock title="An error occurred" message={error.info?.message || "Failed to fectch events."} />
    );
  }

  if (data) {
    content = (
      <ul className="events-list">
        {data.map((event) => (
          <li key={event.id}>
            <EventItem event={event} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="content-section" id="new-events-section">
      <header>
        <h2>Recently added events</h2>
      </header>
      {content}
    </section>
  );
}
