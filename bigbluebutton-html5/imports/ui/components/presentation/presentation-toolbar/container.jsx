import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { withTracker } from 'meteor/react-meteor-data';
import PresentationToolbar from './component';
import PresentationToolbarService from './service';
import FullscreenService from '/imports/ui/components/common/fullscreen-button/service';
import { isPollingEnabled } from '/imports/ui/services/features';
import { PluginsContext } from '/imports/ui/components/components-data/plugin-context/context';
import { useSubscription, useMutation } from '@apollo/client';
import POLL_SUBSCRIPTION from '/imports/ui/core/graphql/queries/pollSubscription';
import { POLL_CANCEL, POLL_CREATE } from '/imports/ui/components/poll/mutations';

const PresentationToolbarContainer = (props) => {
  const pluginsContext = useContext(PluginsContext);
  const { pluginsExtensibleAreasAggregatedState } = pluginsContext;

  const { userIsPresenter, layoutSwapped } = props;

  const { data: pollData } = useSubscription(POLL_SUBSCRIPTION);
  const hasPoll = pollData?.poll?.length > 0;

  const handleToggleFullScreen = (ref) => FullscreenService.toggleFullScreen(ref);

  const [stopPoll] = useMutation(POLL_CANCEL);
  const [createPoll] = useMutation(POLL_CREATE);

  const endCurrentPoll = () => {
    if (hasPoll) stopPoll();
  };

  const startPoll = (pollType, pollId, answers = [], question, isMultipleResponse = false) => {
    Session.set('openPanel', 'poll');
    Session.set('forcePollOpen', true);
    window.dispatchEvent(new Event('panelChanged'));

    createPoll({
      variables: {
        pollType,
        pollId: `${pollId}/${new Date().getTime()}`,
        secretPoll: false,
        question,
        isMultipleResponse,
        answers,
      },
    });
  };

  if (userIsPresenter && layoutSwapped) {
    // Only show controls if user is presenter and layout isn't swapped

    const pluginProvidedPresentationToolbarItems = pluginsExtensibleAreasAggregatedState
      ?.presentationToolbarItems;

    return (
      <PresentationToolbar
        {...props}
        amIPresenter={userIsPresenter}
        endCurrentPoll={endCurrentPoll}
        {...{
          pluginProvidedPresentationToolbarItems,
          handleToggleFullScreen,
          startPoll,
        }}
      />
    );
  }
  return null;
};

export default withTracker(() => {
  return {
    nextSlide: PresentationToolbarService.nextSlide,
    previousSlide: PresentationToolbarService.previousSlide,
    skipToSlide: PresentationToolbarService.skipToSlide,
    isMeteorConnected: Meteor.status().connected,
    isPollingEnabled: isPollingEnabled(),
  };
})(PresentationToolbarContainer);

PresentationToolbarContainer.propTypes = {
  // Number of current slide being displayed
  currentSlideNum: PropTypes.number.isRequired,
  zoom: PropTypes.number.isRequired,
  zoomChanger: PropTypes.func.isRequired,

  // Total number of slides in this presentation
  numberOfSlides: PropTypes.number.isRequired,

  // Actions required for the presenter toolbar
  nextSlide: PropTypes.func.isRequired,
  previousSlide: PropTypes.func.isRequired,
  skipToSlide: PropTypes.func.isRequired,
  layoutSwapped: PropTypes.bool,
};

PresentationToolbarContainer.defaultProps = {
  layoutSwapped: false,
};
