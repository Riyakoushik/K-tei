import { useServerStatus } from "@/app/(main)/_hooks/use-server-status"
import { ContextMenuContent } from "@/components/ui/context-menu"
import { ContextMenu } from "@radix-ui/react-context-menu"
import React from "react"

export type SeaContextMenuProps = {
    content: React.ReactNode
    children?: React.ReactNode
    hideMenuIf?: boolean
    onOpenChange?: (open: boolean) => void
}

export const SeaContextMenu = React.memo((props: SeaContextMenuProps) => {

    const {
        content,
        children,
        hideMenuIf,
        onOpenChange,
        ...rest
    } = props

    const serverStatus = useServerStatus()

    return (
        <ContextMenu data-sea-context-menu onOpenChange={onOpenChange} {...rest}>
            {children}

            {(!hideMenuIf) &&
                <ContextMenuContent className="max-w-xs" data-sea-context-menu-content>
                    {content}
                </ContextMenuContent>}
        </ContextMenu>
    )
})
