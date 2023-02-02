import { useState } from 'react'
import get from 'lodash/get'
import { gql } from 'graphql-request'
import orderBy from 'lodash/orderBy'
import { BaseTokenFieldsFragment } from '@data/api'
import TokenCollection from '@atoms/token-collection'
import collabStyles from '../index.module.scss'
import classNames from 'classnames'
import { useOutletContext } from 'react-router'

export const CollabsTab = () => {
  const { address } = useOutletContext()

  const [hasUnverifiedTokens, setHasUnverifiedTokens] = useState(false)
  const [showUnverified, setShowUnverified] = useState(false)
  const toolbarStyles = classNames(collabStyles.flex, collabStyles.mb2)

  return (
    <>
      {hasUnverifiedTokens ? (
        <div className={toolbarStyles}>
          <label>
            <input
              type="checkbox"
              onChange={() => setShowUnverified(!showUnverified)}
              checked={showUnverified}
            />
            include unverified OBJKTs
          </label>
        </div>
      ) : null}

      <TokenCollection
        label="Artist's Collabs"
        namespace="collabs"
        swrParams={[address]}
        variables={{ address }}
        emptyMessage="no collabs"
        maxItems={null}
        extractTokensFromResponse={(data) => {
          const tokens = data.teia_shareholders
            .map((shareholder) => {
              return get(shareholder, 'split_contract.created_tokens', [])
            })
            .flat()

          setHasUnverifiedTokens(
            tokens.some((token) => !get(token, 'teia_meta.is_signed'))
          )

          return orderBy(tokens, ['minted_at'])
            .reverse()
            .filter(
              (token) => showUnverified || get(token, 'teia_meta.is_signed')
            )
            .map((token) => ({ ...token, key: token.token_id }))
        }}
        query={gql`
          ${BaseTokenFieldsFragment}
          query GetCollabTokens($address: String!) {
            teia_shareholders(
              where: {
                shareholder_address: { _eq: $address }
                holder_type: { _eq: "core_participant" }
              }
            ) {
              split_contract {
                created_tokens(where: { editions: { _gt: "0" } }) {
                  ...baseTokenFields
                }
              }
            }
          }
        `}
      />
    </>
  )
}
