"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import socketIOClient from "socket.io-client";
import userConfig from "../../.config.json";
import styled from "styled-components";

export default function Home() {
  const [payloadData, setPayloadData] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);

  const isFrontendOnly = process.env.NEXT_PUBLIC_PLAYING_FIXTURE === "true";

  // boot-up effects
  useEffect(() => {
    // if frontend local dev, load fixture data
    if (isFrontendOnly) {
      const fixture = require("../fixtures").fixture;
      setPayloadData(fixture);

      return;
    }

    //
    // Socket.io connection to node backend
    const socket = socketIOClient();

    // Event handler to receive payload data from the backend
    socket.on("payload", (data) => {
      const payload = JSON.parse(data);

      if (typeof payload === "string") {
        setPayloadData(JSON.parse(payload));
        return;
      }

      setPayloadData(payload);
    });

    return () => {
      // Clean up the socket connection on unmount
      socket.disconnect();
    };
  }, []);

  // play/pause status
  useEffect(() => {
    if (isFrontendOnly) return;

    if (payloadData?.event === "media.pause") setIsPaused(true);
    if (
      payloadData?.event === "media.play" ||
      payloadData?.event === "media.resume"
    )
      setIsPaused(false);
  }, [payloadData?.event]);

  const albumArtSrc = `https://${userConfig.plexServer.address.replaceAll(
    ".",
    "-"
  )}.${userConfig.libraryID}.plex.direct:${
    userConfig.plexServer.port
  }/photo/:/transcode?width=1200&height=1200&minSize=1&upscale=1&url=${encodeURIComponent(
    payloadData?.Metadata?.thumb
  )}&X-Plex-Token=${userConfig.user.xPlexToken}`;

  if (payloadData?.Metadata?.thumb === undefined) {
    return <h1>Listening...</h1>;
  }

  return (
    <main>
      <Wrapper>
        <AlbumArt
          src={albumArtSrc}
          width={400}
          height={400}
          className={`${isPaused && "paused"}`}
          title={`Album artwork for ${payloadData?.Metadata?.parentTitle} by ${payloadData?.Metadata?.grandparentTitle}`}
          alt={`Album artwork for ${payloadData?.Metadata?.parentTitle} by ${payloadData?.Metadata?.grandparentTitle}`}
          style={{
            filter: isPaused ? `grayscale(0.95)` : `grayscale(0)`,
          }}
        />

        <RightColumn>
          <Artist>{payloadData?.Metadata?.grandparentTitle}</Artist>
          <Title>{payloadData?.Metadata?.title}</Title>
          <Album>
            {payloadData?.Metadata?.parentTitle} (
            {payloadData?.Metadata?.parentYear})
          </Album>
        </RightColumn>
      </Wrapper>
    </main>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding-top: 40px;
  padding-left: 40px;
  padding-right: 40px;
  padding-bottom: 40px;
`;

const RightColumn = styled.div`
  flex-direction: column;
  flex: 1;
  align-items: center;
  justify-content: center;
  display: flex;
`;

const AlbumArt = styled(Image)`
  border-radius: 5px;
  transition: all 1000ms ease-in-out 0ms;
  display: inline-block;
  width: 400px;
  height: 400px;
  margin-right: 2em;
`;

const Artist = styled.p`
  width: auto;
  text-align: center;
  font-size: 14px;
  line-height: 1.1em;
  margin-top: 0;
  margin-bottom: 0;
  font-weight: 300;
  opacity: 1;
`;
const Title = styled.p`
  width: auto;
  text-align: center;
  font-size: 14px;
  line-height: 1.1em;
  margin-top: 0.5em;
  margin-bottom: 0;
  font-weight: 500;
  opacity: 1;
`;
const Album = styled.p`
  width: auto;
  text-align: center;
  font-size: 14px;
  line-height: 1.1em;
  margin-top: 0.5em;
  margin-bottom: 0;
  font-weight: 300;
  opacity: 0.5;
`;
