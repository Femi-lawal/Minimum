import React from 'react'
import { Dimmer, Loader, Image, Segment } from 'semantic-ui-react'

function Callback() {
  return (
    <Segment>
    <Dimmer active>
      <Loader content="Prepare to be underwhelmed"/>
    </Dimmer>

    <Image src='https://react.semantic-ui.com/images/wireframe/short-paragraph.png' />
  </Segment>
  )
}

export default Callback
