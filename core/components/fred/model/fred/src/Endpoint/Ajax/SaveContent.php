<?php

namespace Fred\Endpoint\Ajax;


class SaveContent extends Endpoint
{
    function process()
    {
        if (!isset($this->body['id'])) {
            return $this->failure('No id was provided');
        }

        if (!isset($this->body['data'])) {
            return $this->failure('No data was provided');
        }

        /** @var \modResource $object */
        $object = $this->modx->getObject('modResource', (int)$this->body['id']);
        if (!$object instanceof \modResource) {
            return $this->failure('Could not load resource with id ' . (int)$this->body['id']);
        }

        if (!$object->checkPolicy('save')) {
            return $this->failure('Permission denied (save)');
        }

        if (isset($this->body['content'])) {
            $object->setContent($this->body['content']);
        }

        if (isset($this->body['introtext'])) {
            $object->set('introtext', $this->body['introtext']);
        }

        if (isset($this->body['description'])) {
            $object->set('description', $this->body['description']);
        }

        if (isset($this->body['pagetitle'])) {
            $object->set('pagetitle', $this->body['pagetitle']);
        }

        if (isset($this->body['menutitle'])) {
            $object->set('menutitle', $this->body['menutitle']);
        }

        if (isset($this->body['longtitle'])) {
            $object->set('longtitle', $this->body['longtitle']);
        }

        if (isset($this->body['menuindex'])) {
            $object->set('menuindex', (integer)$this->body['menuindex']);
        }

        if (isset($this->body['hidemenu'])) {
            $object->set('hidemenu', (boolean)$this->body['hidemenu']);
        }

        $uriChanged = false;
        if (isset($this->body['alias'])) {
            $object->set('alias', $this->body['alias']);
            $uriChanged = $object->isDirty('alias');
        }

        if (isset($this->body['published'])) {
            if (!$object->checkPolicy('publish')) {
                return $this->failure('Permission denined (publish)');
            }

            $currentValue = (boolean)$object->get('published');
            $incomingValue = (boolean)$this->body['published'];
            if ($incomingValue !== $currentValue) {
                $object->set('published', (boolean)$this->body['published']);
                $object->set('publishedon', $currentValue ? time() : false);
            }
        }

        $object->setProperty('data', $this->body['data'], 'fred');

        $object->set('editedon', time());
        $object->set('editedby', $this->modx->user->get('id'));

        $saved = $object->save();

        if (!$saved) {
            return $this->failure('Error saving resource with id ' . $object->get('id'));
        }

        $this->modx->getCacheManager()->refresh();

        $response = ['message' => 'Save successful'];
        if ($uriChanged) {
            $response['url'] = $this->modx->makeUrl($object->get('id'));
        }

        return $this->success($response);
    }
}