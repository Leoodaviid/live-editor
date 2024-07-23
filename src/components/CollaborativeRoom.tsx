"use client";
import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import { ClientSideSuspense, RoomProvider } from "@liveblocks/react/suspense";
import { Editor } from "./editor/Editor";
import Image from "next/image";
import Header from "./Header";
import ActiveCollaborators from "./ActiveCollaborators";
import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import { updateDocument } from "@/lib/actions/room.actions";
import Loader from "./Loader";

const CollaborativeRoom = ({
  roomId,
  roomMetadata,
}: CollaborativeRoomProps) => {
  const [documentTitle, setDocumentTitle] = useState<string>(
    roomMetadata.title
  );
  const [editing, setEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const currentUserType = "editor";

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateTitleHandler = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      setLoading(true);
      try {
        if (documentTitle !== roomMetadata.title) {
          const updatedDocument = await updateDocument(roomId, documentTitle);

          if (updatedDocument) {
            setEditing(false);
          }
        }
      } catch (e) {
        console.error(e);
      }
      setEditing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const handlerClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setEditing(false);
        updateDocument(roomId, documentTitle);
      }
    };

    document.addEventListener("mousedown", handlerClickOutside);

    return () => {
      document.removeEventListener("mousedown", handlerClickOutside);
    };
  }, [documentTitle, roomId]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  return (
    <RoomProvider id={roomId}>
      <ClientSideSuspense fallback={<Loader />}>
        <div className="collaborative-room">
          <Header>
            <div
              ref={containerRef}
              className="flex w-fit items-center justify-center gap-2"
            >
              {editing && !loading ? (
                <Input
                  type="text"
                  value={documentTitle}
                  ref={inputRef}
                  placeholder="Enter title"
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  onKeyDown={updateTitleHandler}
                  disabled={!editing}
                  className="document-title-input"
                />
              ) : (
                <>
                  <p className="document-title">{documentTitle}</p>
                </>
              )}
              {currentUserType === "editor" && !editing && (
                <Image
                  src="/assets/icons/edit.svg"
                  alt="Edit"
                  width={24}
                  height={24}
                  onClick={() => setEditing(true)}
                  className="pointer"
                />
              )}
              {currentUserType !== "editor" && !editing && (
                <p className="view-only-tag">View Only</p>
              )}
              {loading && <p className="text-sm text-gray-400">Saving...</p>}
            </div>
            <div className="flex w-full flex-1 justify-end gap-2 sm:gap-3">
              <ActiveCollaborators />
              <SignedOut>
                <SignInButton />
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </Header>
          <Editor />
        </div>
      </ClientSideSuspense>
    </RoomProvider>
  );
};

export default CollaborativeRoom;
